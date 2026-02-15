---
name: api-endpoint
description: 'Crée et modifie les endpoints HTTP et contrats API avec Effect HTTP : routes, DTOs request/response, error mapping RFC 7807. Utiliser quand: (1) Ajouter/modifier un endpoint HTTP, (2) Modifier une route, (3) Ajouter un DTO request/response, (4) Créer un error code, (5) Modifier le contrat API, (6) Exposer un use case en HTTP, (7) Créer une route API, (8) Mapper les erreurs domaine vers RFC 7807, (9) Add an endpoint, (10) Modify a route, (11) Add a DTO, (12) Create an error code, (13) Modify the API contract, (14) Expose via HTTP, (15) Create a route, (16) Add an HTTP endpoint, (17) Map errors.'
---

# API Endpoint Skill

## Architecture

- **Contract** (`packages/api`): routes, DTOs, error codes — shareable
- **Implementation** (`apps/server/src/infrastructure/http/`): handlers, mappers, helpers

## Workflow

1. Add endpoint constants in `packages/api/src/endpoints.ts`
2. Declare the route in `packages/api/src/routes.ts` (HttpApiGroup)
3. Create request DTO in `packages/api/src/dtos/{entity}.request.ts`
4. Create response DTO in `packages/api/src/dtos/{entity}.response.ts`
5. Add error codes in `packages/api/src/errors/error-codes.ts` if needed
6. Add error DTOs in `packages/api/src/dtos/errors.ts` if new error type
7. Implement the HTTP handler in `apps/server/src/infrastructure/http/handlers/`
8. Create error mapper in `apps/server/src/infrastructure/http/mappers/`
9. Wire with `executeWithObservability` and `generateCommandContext`

## Rules & Conventions

### Endpoint Paths

```typescript
export const Endpoints = {
  PILOT_PRODUCT: '/pilot-product',
  PILOT_PRODUCT_BY_ID: '/pilot-product/:id',
} as const

export const FullPaths = {
  PILOT_PRODUCT: `${ApiPrefix}${Endpoints.PILOT_PRODUCT}`,
} as const

export const GroupNames = {
  PILOT_PRODUCT: 'pilot-product',
} as const
```

### Route Declaration (HttpApiGroup)

```typescript
export class PilotProductGroup extends HttpApiGroup.make(GroupNames.PILOT_PRODUCT)
  .add(
    HttpApiEndpoint.post('create', Endpoints.PILOT_PRODUCT)
      .setPayload(CreatePilotProductRequest)
      .addSuccess(PilotProductResponse)
      .addError(ApiValidationError, { status: ApiValidationError.status })
      .addError(ApiPersistenceError, { status: ApiPersistenceError.status })
  )
  .add(
    HttpApiEndpoint.get('getById', Endpoints.PILOT_PRODUCT_BY_ID)
      .setPath(S.Struct({ id: S.String }))
      .addSuccess(PilotProductResponse)
      .addError(ApiNotFoundError, { status: ApiNotFoundError.status })
  )
  .prefix(ApiPrefix) {}

export class MaisonAmaneApi extends HttpApi.make('maison-amane-api')
  .add(SystemGroup)
  .add(PilotProductGroup) {}
```

### Error DTOs — RFC 7807

Base fields from `ProblemDetailFields` + custom extensions:

```typescript
export class ApiValidationError extends S.TaggedClass<ApiValidationError>()('ApiValidationError', {
  ...withStatus(HttpStatus.BAD_REQUEST),
  ...CustomExtensionFields,
  errors: S.Array(S.String),
}) {
  static readonly status = HttpStatus.BAD_REQUEST
}

export class ApiNotFoundError extends S.TaggedClass<ApiNotFoundError>()('ApiNotFoundError', {
  ...withStatus(HttpStatus.NOT_FOUND),
  ...CustomExtensionFields,
  resource: S.String,
  resourceId: S.String,
}) {
  static readonly status = HttpStatus.NOT_FOUND
}
```

`ProblemDetailFields`: `{ type, title, status, detail, instance }`
`CustomExtensionFields`: `{ correlationId, code, timestamp }`

### Error Codes

Centralized in `packages/api/src/errors/error-codes.ts`:

```typescript
export const ValidationErrorCodes = { INVALID_PRODUCT_DATA: 'PILOT_VALIDATION_001' } as const
export const NotFoundErrorCodes = { PRODUCT_NOT_FOUND: 'PILOT_NOT_FOUND_001' } as const

export const ErrorCodeTitles: Record<ErrorCode, string> = {
  [ValidationErrorCodes.INVALID_PRODUCT_DATA]: 'Invalid Product Data',
  [NotFoundErrorCodes.PRODUCT_NOT_FOUND]: 'Product Not Found',
}
```

### Error Mapper (domain → RFC 7807)

One mapper per command type, using type guards:

```typescript
export const toProblemDetail = (
  error: PilotProductCreationError,
  ctx: ErrorContext
): ApiValidationError | ApiPersistenceError | ApiInternalError => {
  if (isValidationError(error)) return toValidationProblemDetail(error, ctx)
  if (isPersistenceError(error)) return toPersistenceProblemDetail(error, ctx)
  return toInternalProblemDetail(ctx)
}

export const toUpdateProblemDetail = (error: PilotProductUpdateError, ctx: ErrorContext) => {
  if (isValidationError(error)) return toValidationProblemDetail(error, ctx)
  if (isProductNotFoundError(error))
    return toNotFoundProblemDetail('PilotProduct', error.productId, ctx)
  if (isPersistenceError(error)) return toPersistenceProblemDetail(error, ctx)
  return toInternalProblemDetail(ctx)
}
```

### HTTP Handler Pattern

```typescript
export const PilotProductHandlerLive = HttpApiBuilder.group(
  MaisonAmaneApi,
  GroupNames.PILOT_PRODUCT,
  (handlers) =>
    handlers.handle('create', ({ payload }) =>
      gen(function* () {
        const { correlationId, userId, ctx, errorCtx } = yield* generateCommandContext(
          FullPaths.PILOT_PRODUCT
        )
        const command = makePilotProductCreationCommand({
          data: toUnvalidatedProductData(payload),
          correlationId: makeCorrelationId(correlationId),
          userId: makeUserId(userId),
          timestamp: new Date(),
        })
        const product = yield* executeWithObservability(
          ctx,
          'createPilotProduct',
          `POST ${FullPaths.PILOT_PRODUCT}`,
          pilotProductCreationHandler(command),
          (error) => toProblemDetail(error, errorCtx)
        )
        yield* logInfo('Pilot product created successfully').pipe(
          annotateLogs({ productId: product.id })
        )
        return toResponse(product)
      })
    )
)
```

### Helpers

- `generateCommandContext(path)`: generates `correlationId`, `userId`, `ctx`, `errorCtx`
- `executeWithObservability(ctx, name, description, effect, errorMapper)`: wraps handler with logging/tracing + error mapping

### Request DTO → Command DTO

Use `toUnvalidatedProductData(payload)` to separate HTTP layer from application layer.

## Reference Files

| Pattern            | File                                                                    |
| ------------------ | ----------------------------------------------------------------------- |
| Routes             | `packages/api/src/routes.ts`                                            |
| Endpoints          | `packages/api/src/endpoints.ts`                                         |
| Error DTOs         | `packages/api/src/dtos/errors.ts`                                       |
| ProblemDetail base | `packages/api/src/errors/problem-detail.ts`                             |
| Error codes        | `packages/api/src/errors/error-codes.ts`                                |
| HTTP handler       | `apps/server/src/infrastructure/http/handlers/pilot-product.handler.ts` |
| Error mapper       | `apps/server/src/infrastructure/http/mappers/problem-detail.mapper.ts`  |
| Helpers            | `apps/server/src/infrastructure/http/helpers/`                          |

## Quality Checklist

- [ ] Contract in `packages/api`, implementation in `apps/server`
- [ ] DTOs request/response defined with Schema
- [ ] Endpoint declared with HttpApiEndpoint + HttpApiGroup
- [ ] Handler uses `executeWithObservability`
- [ ] `generateCommandContext` for correlationId/userId
- [ ] Request DTO → command DTO via helper function
- [ ] Error mapping: domain errors → RFC 7807 ProblemDetail
- [ ] Error codes centralized in `error-codes.ts`
- [ ] Status codes on error classes (`static readonly status`)
