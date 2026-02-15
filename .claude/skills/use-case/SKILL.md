---
name: use-case
description: 'Crée et modifie les use cases applicatifs CQRS avec Effect-TS : command/query handlers, validation, mappers. Utiliser quand: (1) Créer/modifier un handler (command ou query), (2) Ajouter une query, (3) Ajouter une commande, (4) Modifier la validation applicative, (5) Étendre un handler existant, (6) Créer un query handler, (7) Créer un command handler, (8) Implémenter un use case, (9) Ajouter un mapper applicatif, (10) Create a handler, (11) Modify a use case, (12) Add a query, (13) Add a command, (14) Modify validation, (15) Extend an existing handler, (16) Create a query handler, (17) Create a command handler, (18) Implement a use case, (19) Add a mapper.'
---

# Use Case Skill

## Workflow — Command Handler

1. Create the command DTO in `application/{context}/commands/`
2. Create the validation schema in `application/{context}/validation/`
3. Implement the handler in `application/{context}/handlers/`
4. Call repository (`getById` for updates, `save` for creates)
5. Call aggregate methods if state transitions needed
6. Emit event if `requiresChangeNotification()` is true
7. Export from `index.ts`

## Workflow — Query Handler

1. Create the query DTO in `application/{context}/queries/` (use `Data.case`)
2. Implement the handler
3. Call repository (`getById`)
4. Return domain entity or mapped response
5. Export from `index.ts`

## Rules & Conventions

### Handler Naming

- `pilotProductCreationHandler` — NOT `handlePilotProductCreation`
- `pilotProductUpdateHandler`
- `getPilotProductHandler`

### Selective Imports

```typescript
import { type Effect, gen } from 'effect/Effect'
import { Option } from 'effect'
```

### Command DTO

Tagged struct with context fields. Uses `@maison-amane/api` request types for unvalidated data:

```typescript
const PilotProductCreationCommandSchema = S.TaggedStruct('CreatePilotProductCommand', {
  data: CreatePilotProductRequest,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductCreationCommand = typeof PilotProductCreationCommandSchema.Type

export const makePilotProductCreationCommand = (
  params: Omit<PilotProductCreationCommand, '_tag'>
): PilotProductCreationCommand =>
  Data.case<PilotProductCreationCommand>()({ _tag: 'CreatePilotProductCommand', ...params })
```

Update command includes `productId`:

```typescript
const PilotProductUpdateCommandSchema = S.TaggedStruct('UpdatePilotProductCommand', {
  productId: ProductIdSchema,
  data: UpdatePilotProductRequest,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})
```

### Query DTO

Use `Data.case` directly (no Schema needed for simple queries):

```typescript
const GetPilotProductQuery = Data.case<{
  readonly _tag: 'GetPilotProductQuery'
  readonly productId: ProductId
}>()

export type GetPilotProductQuery = ReturnType<typeof GetPilotProductQuery>

export const makeGetPilotProductQuery = (productId: ProductId): GetPilotProductQuery =>
  GetPilotProductQuery({ _tag: 'GetPilotProductQuery', productId })
```

### Create Handler Pattern

```typescript
export const pilotProductCreationHandler = (
  command: PilotProductCreationCommand
): Effect<
  PilotProduct,
  PilotProductCreationError,
  PilotProductRepository | IdGenerator | EventPublisher | Clock
> =>
  gen(function* () {
    const validated = yield* validateProductData(command.data)
    const product = yield* createAggregate(validated)

    const repo = yield* PilotProductRepository
    const savedProduct = yield* repo.save(product)

    if (requiresChangeNotification(savedProduct)) {
      yield* emitEvent(savedProduct, command)
    }

    return savedProduct
  })
```

### Update Handler Pattern

Uses `Option` for partial fields, calls aggregate methods for state transitions:

```typescript
export const pilotProductUpdateHandler = (
  command: PilotProductUpdateCommand
): Effect<PilotProduct, PilotProductUpdateError, PilotProductRepository | EventPublisher | Clock> =>
  gen(function* () {
    const validated = yield* validateUpdateData(command.data)
    const repo = yield* PilotProductRepository
    const existingProduct = yield* repo.getById(command.productId)

    const updatedProduct = yield* applyUpdates(existingProduct, validated)
    const savedProduct = yield* repo.update(updatedProduct)

    if (requiresChangeNotification(savedProduct)) {
      yield* emitEvent(savedProduct, command)
    }
    return savedProduct
  })
```

Apply updates with `Option.getOrElse`:

```typescript
const updated = withUpdatedFields(
  product,
  {
    label: Option.getOrElse(validated.label, () => product.label),
    variants: Option.match(validated.variants, {
      onNone: () => product.variants,
      onSome: (v) => createVariants(v),
    }),
  },
  now
)

// Status transitions through aggregate methods
if (newStatus === ProductStatus.PUBLISHED) return yield * publish(updated, now)
if (newStatus === ProductStatus.ARCHIVED) return yield * archive(updated, now)
```

### Query Handler Pattern

```typescript
export const getPilotProductHandler = (
  query: GetPilotProductQuery
): Effect<PilotProduct, PilotProductQueryError, PilotProductRepository> =>
  gen(function* () {
    const repo = yield* PilotProductRepository
    return yield* repo.getById(query.productId)
  })
```

### Validation — Create

Schema struct using domain schemas, validator wraps `ParseError` → `ValidationError`:

```typescript
const ValidatedProductDataSchema = S.Struct({
  label: ProductLabelSchema,
  type: ProductTypeSchema,
  variants: S.NonEmptyArray(ValidatedVariantSchema),
  views: ProductViewsTransformSchema,
  status: ProductStatusSchema,
})

export const validateProductData = (
  data: UnvalidatedProductData
): Effect<ValidatedProductData, ValidationError> =>
  S.decodeUnknown(ValidatedProductDataSchema)(data).pipe(mapError(ValidationError.fromParseError))
```

### Validation — Update (Option fields)

```typescript
const validateOptionalField = <A, I, R>(
  value: unknown,
  schema: S.Schema<A, I, R>
): Effect<OptionType<A>, ValidationError, R> => {
  if (value === undefined) return succeed(Option.none())
  return S.decodeUnknown(schema)(value).pipe(
    map(Option.some),
    mapError(ValidationError.fromParseError)
  )
}
```

### Validation — transformOrFail

For complex transformations (e.g., unvalidated variant → validated variant):

```typescript
export const ValidatedVariantSchema = S.transformOrFail(
  UnvalidatedVariantSchema, S.typeSchema(VariantBaseSchema), {
    strict: true,
    decode: (input) => {
      if (input.size === Size.CUSTOM)
        return S.decodeUnknown(CustomVariantTargetSchema)({ _tag: 'CustomVariant', ...input })
          .pipe(mapError((e) => e.issue))
      return S.decodeUnknown(StandardVariantTargetSchema)({ _tag: 'StandardVariant', size: input.size })
        .pipe(mapError((e) => e.issue))
    },
    encode: (validated) => ParseResult.succeed({ size: validated.size, ... }),
  }
)
```

### Validation — transform (views)

```typescript
export const ProductViewsTransformSchema = S.transform(
  ProductViewsInputSchema,
  S.typeSchema(ProductViewsSchema),
  { strict: true, decode: structureViews, encode: flattenViews }
)
```

### Mapper — Validated → Domain

```typescript
export const createVariant = (v: ValidatedVariant): ProductVariant => {
  if (v._tag === 'CustomVariant') return makeCustomVariant({ size: Size.CUSTOM, ... })
  return makeStandardVariant({ size: v.size })
}

export const createVariants = (
  validatedVariants: readonly [ValidatedVariant, ...ValidatedVariant[]]
): readonly [ProductVariant, ...ProductVariant[]] => {
  const [first, ...rest] = validatedVariants
  return [createVariant(first), ...rest.map(createVariant)] as const
}
```

### Event Emission

Use `publishEvent` helper with retry. Only emit when `requiresChangeNotification()` returns true:

```typescript
import { publishEvent } from '../../shared/event-helpers'

// publishEvent has exponential retry (500ms → 1s → 2s, 3 attempts)
// Never fails — logs CRITICAL on exhaustion
```

### Repository Usage

- **`getById`**: for handlers that require entity existence (updates, queries by ID) — fails with `NotFoundError | PersistenceError`
- **`findById`**: when absence is acceptable — returns `Option<Entity>`

## Reference Files

| Pattern                | File                                                                         |
| ---------------------- | ---------------------------------------------------------------------------- |
| Command DTO (create)   | `apps/server/src/application/pilot/commands/create-pilot-product.command.ts` |
| Command DTO (update)   | `apps/server/src/application/pilot/commands/update-pilot-product.command.ts` |
| Query DTO              | `apps/server/src/application/pilot/queries/get-pilot-product.query.ts`       |
| Create handler         | `apps/server/src/application/pilot/handlers/create-pilot-product.handler.ts` |
| Update handler         | `apps/server/src/application/pilot/handlers/update-pilot-product.handler.ts` |
| Query handler          | `apps/server/src/application/pilot/handlers/get-pilot-product.handler.ts`    |
| Validation (create)    | `apps/server/src/application/pilot/validation/product-data.schema.ts`        |
| Validation (update)    | `apps/server/src/application/pilot/validation/update-product-data.schema.ts` |
| Validation (transform) | `apps/server/src/application/pilot/validation/variant-input.schema.ts`       |
| Validation (views)     | `apps/server/src/application/pilot/validation/views.schema.ts`               |
| Mapper                 | `apps/server/src/application/pilot/mappers/variant.mapper.ts`                |
| Event helpers          | `apps/server/src/application/shared/event-helpers.ts`                        |

## Quality Checklist

- [ ] Handler naming: `{entity}{Action}Handler` (camelCase)
- [ ] Selective imports from Effect
- [ ] Command with context fields (correlationId, userId, timestamp)
- [ ] Query with `Data.case` if simple
- [ ] Validation wraps `ParseError` → `ValidationError`
- [ ] `getById` for write handlers, `findById` for optional reads
- [ ] Event emission via `publishEvent` + `requiresChangeNotification`
- [ ] Barrel export in `index.ts`
