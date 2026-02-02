# Domain Events

## Structure standard

Tous les events suivent cette structure :

```typescript
// domain/{context}/events.ts
import { Data } from 'effect'
import * as S from 'effect/Schema'
import { CorrelationIdSchema, UserIdSchema } from '@maison-amane/shared-kernel'

// =============================================================================
// PRODUCT PUBLISHED EVENT
// =============================================================================

const PilotProductPublishedSchema = S.TaggedStruct('PilotProductPublished', {
  // Identifiant de l'entité concernée
  productId: ProductIdSchema,

  // Payload (snapshot de l'entité ou données pertinentes)
  product: PilotProductSchema,

  // Metadata obligatoires
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductPublished = typeof PilotProductPublishedSchema.Type

export const MakePilotProductPublished = (
  params: Omit<PilotProductPublished, '_tag'>
): PilotProductPublished =>
  Data.case<PilotProductPublished>()({ _tag: 'PilotProductPublished', ...params })

// =============================================================================
// PRODUCT SYNCED EVENT
// =============================================================================

const PilotProductSyncedSchema = S.TaggedStruct('PilotProductSynced', {
  productId: ProductIdSchema,
  shopifyProductId: ShopifyProductIdSchema,
  syncedAt: S.Date,

  // Metadata
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductSynced = typeof PilotProductSyncedSchema.Type

export const MakePilotProductSynced = (
  params: Omit<PilotProductSynced, '_tag'>
): PilotProductSynced => Data.case<PilotProductSynced>()({ _tag: 'PilotProductSynced', ...params })

// =============================================================================
// DOMAIN EVENTS UNION
// =============================================================================

export type PilotDomainEvent = PilotProductPublished | PilotProductSynced
```

## Metadata obligatoires

Chaque event doit inclure :

| Field           | Type                  | Usage                       |
| --------------- | --------------------- | --------------------------- |
| `correlationId` | `CorrelationIdSchema` | Traçabilité distribuée      |
| `userId`        | `UserIdSchema`        | Audit (qui a déclenché)     |
| `timestamp`     | `S.Date`              | Quand l'event s'est produit |

## Nommage

Convention : `{Entity}{Action}` au passé

```typescript
// ✅ Bon
'PilotProductPublished' // Produit publié
'OrderCreated' // Commande créée
'PaymentConfirmed' // Paiement confirmé

// ❌ Éviter
'PublishProduct' // Présent (c'est une commande, pas un event)
'ProductWasPublished' // Redondant
```

## Émission dans un handler

```typescript
const emitEvent = (
  product: PilotProduct,
  command: PilotProductCreationCommand
): Effect.Effect<void, never, EventPublisher | Clock> =>
  Effect.gen(function* () {
    const publisher = yield* EventPublisher
    const clock = yield* Clock
    const now = yield* clock.now()

    const event = MakePilotProductPublished({
      productId: product.id,
      product,
      correlationId: command.correlationId,
      userId: command.userId,
      timestamp: now,
    })

    // Publier sans faire échouer la commande
    yield* publisher
      .publish(event)
      .pipe(
        Effect.catchAll((error) =>
          Effect.logError('Failed to publish event').pipe(
            Effect.annotateLogs({ error: String(error) })
          )
        )
      )
  })
```

## Consommation (projection)

```typescript
// application/{context}/handlers/catalog-projection.handler.ts
export const handlePilotProductPublished = (
  event: PilotProductPublished
): Effect.Effect<CatalogProduct, ProjectionError, CatalogProductRepository> =>
  Effect.gen(function* () {
    const repo = yield* CatalogProductRepository

    // Transformer Write Model → Read Model
    const catalogProduct = MakeCatalogProduct({
      id: event.productId,
      label: event.product.label,
      // ... projection logic
    })

    return yield* repo.upsert(catalogProduct)
  })
```

## Checklist

- [ ] `S.TaggedStruct` avec `_tag` unique (nom de l'event)
- [ ] `correlationId`, `userId`, `timestamp` obligatoires
- [ ] Payload minimal mais suffisant pour la projection
- [ ] Constructeur `Make{EventName}`
- [ ] Union type pour tous les events du contexte
- [ ] Nommage au passé (`Created`, `Published`, `Synced`)
