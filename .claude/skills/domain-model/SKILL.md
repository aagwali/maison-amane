---
name: domain-model
description: 'Modélise et modifie la couche domaine DDD avec Effect-TS : aggregates, value objects, events, errors, services, enums. Utiliser quand: (1) Créer/modifier un aggregate, (2) Ajouter/modifier un value object (branded IDs, scalars, tagged unions), (3) Créer/étendre des events versionnés, (4) Ajouter un état à une state machine, (5) Créer des erreurs domaine typées, (6) Créer/modifier des enums, (7) Créer un service domaine, (8) Ajouter un champ au domaine, (9) Créer un branded type, (10) Create an aggregate, (11) Add a field, (12) Modify a value object, (13) Extend events, (14) Add a state to the state machine, (15) Add a domain error, (16) Remove an enum, (17) Create a domain service, (18) Add an event, (19) Modify the aggregate, (20) Create a branded type.'
---

# Domain Model Skill

## Workflow

1. Identify the domain entity type to create/modify
2. Read relevant reference files for the pattern
3. Create the Effect Schema with correct naming conventions
4. Create the constructor (factory function)
5. For aggregates: add business methods as pure functions
6. For events: add `_version` field
7. Extract TypeScript types from Schemas
8. Export from `index.ts`

## Rules & Conventions

### Naming

- **Constructors**: camelCase — `makePilotProduct`, `makeProductId` (NOT `MakePilotProduct`)
- **Schemas**: PascalCase — `PilotProductSchema`, `ProductIdSchema`
- **Types**: extracted from Schema — `type PilotProduct = typeof PilotProductSchema.Type`

### Aggregate

Root entity with `S.TaggedStruct` and `Data.case` constructor:

```typescript
export const PilotProductSchema = S.TaggedStruct('PilotProduct', {
  id: ProductIdSchema,
  label: ProductLabelSchema,
  // ... fields
})

export type PilotProduct = typeof PilotProductSchema.Type

export const makePilotProduct = (params: Omit<PilotProduct, '_tag'>): PilotProduct =>
  Data.case<PilotProduct>()({ _tag: 'PilotProduct', ...params })
```

**Methods** are pure functions outside the aggregate:

```typescript
// Simple update (no Effect needed)
export const withUpdatedFields = (
  product: PilotProduct,
  updates: Partial<Pick<PilotProduct, 'label' | 'type'>>,
  updatedAt: Date
): PilotProduct => makePilotProduct({ ...product, ...updates, updatedAt })

// State transition (may fail → Effect)
export const publish = (
  product: PilotProduct,
  updatedAt: Date
): Effect<PilotProduct, PublicationNotAllowed> => {
  if (product.status === ProductStatus.ARCHIVED)
    return fail(new PublicationNotAllowed({ reason: 'Cannot publish an archived product' }))
  return succeed(makePilotProduct({ ...product, status: ProductStatus.PUBLISHED, updatedAt }))
}
```

**Policies** (aggregate knowledge):

```typescript
export const requiresChangeNotification = (product: PilotProduct): boolean =>
  product.status === ProductStatus.PUBLISHED || product.status === ProductStatus.ARCHIVED
```

### Branded IDs

```typescript
export const ProductIdSchema = S.String.pipe(S.brand('ProductId'))
export type ProductId = typeof ProductIdSchema.Type
export const makeProductId = S.decodeUnknownSync(ProductIdSchema)
```

### Branded Scalars (with constraints)

```typescript
export const ProductLabelSchema = S.Trim.pipe(
  S.minLength(1),
  S.maxLength(255),
  S.brand('ProductLabel')
)
export type ProductLabel = typeof ProductLabelSchema.Type
export const makeProductLabel = S.decodeUnknownSync(ProductLabelSchema)
```

### Tagged Unions (discriminated)

```typescript
const NotSyncedSchema = S.TaggedStruct('NotSynced', {})
const SyncedSchema = S.TaggedStruct('Synced', {
  shopifyProductId: ShopifyProductIdSchema,
  syncedAt: S.Date,
})
const SyncFailedSchema = S.TaggedStruct('SyncFailed', {
  error: SyncErrorSchema,
  failedAt: S.Date,
  attempts: S.Number,
})

export const SyncStatusSchema = S.Union(NotSyncedSchema, SyncedSchema, SyncFailedSchema)
export type SyncStatus = typeof SyncStatusSchema.Type

// Constructors for each variant
export const makeNotSynced = (): NotSynced => Data.case<NotSynced>()({ _tag: 'NotSynced' })
export const makeSynced = (params: Omit<Synced, '_tag'>): Synced =>
  Data.case<Synced>()({ _tag: 'Synced', ...params })
```

### Structured Value Objects

```typescript
export const ProductViewsSchema = S.Struct({
  front: ProductViewSchema,
  detail: ProductViewSchema,
  additional: S.Array(ProductViewSchema),
})
```

### Variant Tagged Unions (polymorphic)

```typescript
const StandardVariantBaseSchema = S.Struct({
  _tag: S.Literal('StandardVariant'),
  size: S.Literal(Size.REGULAR, Size.LARGE),
})
const CustomVariantBaseSchema = S.Struct({
  _tag: S.Literal('CustomVariant'),
  size: S.Literal(Size.CUSTOM),
  customDimensions: CustomDimensionSchema,
  price: PriceSchema,
})
export const ProductVariantSchema = S.Union(StandardVariantBaseSchema, CustomVariantBaseSchema)
```

### Events (versioned)

Every event MUST have `_version: S.Literal(N)`. Constructor omits `_tag` and `_version`:

```typescript
const PilotProductPublishedSchema = S.TaggedStruct('PilotProductPublished', {
  _version: S.Literal(1),
  productId: ProductIdSchema,
  product: PilotProductSchema,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductPublished = typeof PilotProductPublishedSchema.Type

export const makePilotProductPublished = (
  params: Omit<PilotProductPublished, '_tag' | '_version'>
): PilotProductPublished =>
  Data.case<PilotProductPublished>()({ _tag: 'PilotProductPublished', _version: 1, ...params })
```

Union type for all events:

```typescript
export type PilotDomainEvent = PilotProductPublished | PilotProductUpdated
```

### Event Evolution (schema versioning)

Quand un event doit évoluer (cf. ADR-8) :

**Ajout de champ (non-breaking) :**

1. Incrémenter `_version` : `S.Literal(1)` → `S.Literal(2)`
2. Ajouter le champ comme `S.optional` (pour compatibilité consumer)
3. Mettre à jour le constructeur `make{Event}` avec la nouvelle version
4. Les consumers existants continuent à fonctionner (le champ est optionnel)

**Changement structurel (breaking) :**

1. Créer un NOUVEL event (ex: `PilotProductPublishedV2`)
2. Marquer l'ancien avec un commentaire `// @deprecated - use PilotProductPublishedV2`
3. Le handler publie le nouveau event
4. Les consumers gèrent les deux versions via un upcaster
5. Nettoyer l'ancien event quand tous les consumers sont migrés

**Règles :**

- JAMAIS supprimer un champ d'un event existant
- JAMAIS renommer un champ (c'est un breaking change)
- Toujours incrémenter `_version` lors de toute modification
- Le constructeur omit toujours `_tag` ET `_version`

### Errors

Named by context, using `Data.TaggedError`:

```typescript
export class ValidationError extends Data.TaggedError('ValidationError')<{
  readonly cause: ParseError
}> {
  static fromParseError(cause: ParseError): ValidationError {
    return new ValidationError({ cause })
  }
}

export class ProductNotFoundError extends Data.TaggedError('ProductNotFoundError')<{
  readonly productId: string
}> {}
```

Aggregate error union types:

```typescript
export type PilotProductCreationError = ValidationError | PersistenceError
```

### Enums

Use shared `fromEnum` helper:

```typescript
export const ProductStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus]
export const ProductStatusSchema = fromEnum(ProductStatus)
```

### Domain Services (State Machines)

Object with transitions and guards:

```typescript
export const SyncStatusMachine = {
  initial: (): NotSynced => makeNotSynced(),
  markSynced: (_current: NotSynced | SyncFailed | Synced, shopifyProductId, syncedAt): Synced =>
    makeSynced({ shopifyProductId, syncedAt }),
  canSync: (status: SyncStatus): status is NotSynced | SyncFailed =>
    status._tag === 'NotSynced' || status._tag === 'SyncFailed',
}
```

### Reference Data

Lookup tables as `Record<Enum, Record<Enum, Value>>`:

```typescript
export const PRICE_BY_RANGE: Record<PriceRange, Record<Size, number>> = { ... }
export const getPriceForVariant = (variant: ProductVariant, priceRange: PriceRange): number => { ... }
```

### Barrel Exports

Every domain module MUST have an `index.ts` re-exporting all public entities grouped by category.

## Reference Files

| Pattern              | File                                                           |
| -------------------- | -------------------------------------------------------------- |
| Aggregate + methods  | `apps/server/src/domain/pilot/aggregate.ts`                    |
| Branded IDs          | `apps/server/src/domain/pilot/value-objects/ids.ts`            |
| Branded scalars      | `apps/server/src/domain/pilot/value-objects/scalar-types.ts`   |
| Tagged union (state) | `apps/server/src/domain/pilot/value-objects/sync-status.ts`    |
| Variant union        | `apps/server/src/domain/pilot/value-objects/variants.ts`       |
| Structured VO        | `apps/server/src/domain/pilot/value-objects/views.ts`          |
| Events versioned     | `apps/server/src/domain/pilot/events.ts`                       |
| Errors               | `apps/server/src/domain/pilot/errors.ts`                       |
| Enums                | `apps/server/src/domain/pilot/enums.ts`                        |
| State machine        | `apps/server/src/domain/pilot/services/sync-status.machine.ts` |
| Reference data       | `apps/server/src/domain/pilot/reference-data.ts`               |
| Barrel exports       | `apps/server/src/domain/pilot/index.ts`                        |

## Quality Checklist

- [ ] Constructors in camelCase, Schemas in PascalCase
- [ ] Events with `_version: S.Literal(N)`
- [ ] Event constructor omits `_tag` and `_version`
- [ ] Aggregate methods are pure functions
- [ ] Errors named by context (not generic)
- [ ] Barrel export in `index.ts`
- [ ] Immutability via `Data.case()`
- [ ] Types extracted from Schemas
