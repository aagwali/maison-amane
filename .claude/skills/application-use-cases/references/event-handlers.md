# Event Handlers (Projections & Consumers)

## Projection Handler (Write → Read Model)

```typescript
// application/catalog/handlers/catalog-projection.handler.ts
import { Effect } from 'effect'

import type { PilotProductPublished } from '../../../domain/pilot'
import { MakeCatalogProduct, type CatalogProduct } from '../../../domain/catalog'
import { CatalogProductRepository } from '../../../ports/driven'
import type { MessageHandlerError } from '../../../infrastructure/messaging'

// =============================================================================
// PROJECTION HANDLER
// =============================================================================

export const handleCatalogProjection = (
  event: PilotProductPublished
): Effect.Effect<CatalogProduct, MessageHandlerError, CatalogProductRepository> =>
  Effect.gen(function* () {
    const repo = yield* CatalogProductRepository

    // 1. Log event reception
    yield* Effect.logInfo('Projecting product to catalog').pipe(
      Effect.annotateLogs({
        productId: event.productId,
        correlationId: event.correlationId,
      })
    )

    // 2. Transform Write Model → Read Model
    const catalogProduct = mapToCatalogProduct(event.product)

    // 3. Upsert (create or update)
    const result = yield* repo.upsert(catalogProduct).pipe(
      Effect.mapError(
        (e) =>
          new MessageHandlerError({
            handler: 'catalogProjection',
            cause: e,
          })
      )
    )

    yield* Effect.logInfo('Product projected successfully')

    return result
  }).pipe(Effect.withLogSpan('catalog-projection'))

// =============================================================================
// MAPPER
// =============================================================================

const mapToCatalogProduct = (product: PilotProduct): CatalogProduct =>
  MakeCatalogProduct({
    id: product.id,
    label: product.label,
    category: product.category,
    thumbnailUrl: product.views.front.imageUrl,
    priceRange: product.priceRange,
    variants: product.variants.map(mapVariant),
    // ... autres champs UI-optimized
  })
```

## Message Handler Type

Interface pour les consumers RabbitMQ :

```typescript
// infrastructure/messaging/rabbitmq/types.ts
import { Effect } from 'effect'

export type MessageHandler<TEvent, TDeps> = (
  event: TEvent
) => Effect.Effect<void, MessageHandlerError, TDeps>
```

## Sync Handler (External Service)

```typescript
// application/shopify/handlers/shopify-sync.handler.ts
import { Effect } from 'effect'

import type { PilotProductPublished } from '../../../domain/pilot'
import { SyncStatusMachine } from '../../../domain/pilot/services'
import { PilotProductRepository, ShopifyClient, Clock } from '../../../ports/driven'
import { mapToShopifyProduct } from '../mappers'

export const handleShopifySync = (
  event: PilotProductPublished
): Effect.Effect<void, MessageHandlerError, PilotProductRepository | ShopifyClient | Clock> =>
  Effect.gen(function* () {
    const repo = yield* PilotProductRepository
    const shopify = yield* ShopifyClient
    const clock = yield* Clock

    const product = event.product

    // 1. Vérifier si sync autorisé (guard)
    if (!SyncStatusMachine.canSync(product.syncStatus)) {
      yield* Effect.logInfo('Product already synced, skipping')
      return
    }

    // 2. Map to Shopify format
    const shopifyInput = mapToShopifyProduct(product)

    // 3. Call Shopify API
    const result = yield* shopify.productSet(shopifyInput).pipe(Effect.either)

    // 4. Update sync status based on result
    const now = yield* clock.now()

    if (result._tag === 'Right') {
      const response = result.right

      // Check for user errors
      if (response.userErrors && response.userErrors.length > 0) {
        const newStatus = SyncStatusMachine.markFailed(
          product.syncStatus,
          { code: 'USER_ERROR', message: response.userErrors[0].message },
          now
        )
        yield* repo.update({ ...product, syncStatus: newStatus, updatedAt: now })
        return
      }

      // Success
      const newStatus = SyncStatusMachine.markSynced(product.syncStatus, response.product.id, now)
      yield* repo.update({ ...product, syncStatus: newStatus, updatedAt: now })

      yield* Effect.logInfo('Product synced to Shopify').pipe(
        Effect.annotateLogs({ shopifyId: response.product.id })
      )
    } else {
      // API error
      const newStatus = SyncStatusMachine.markFailed(
        product.syncStatus,
        { code: 'API_ERROR', message: String(result.left) },
        now
      )
      yield* repo.update({ ...product, syncStatus: newStatus, updatedAt: now })
    }
  }).pipe(Effect.withLogSpan('shopify-sync'))
```

## Patterns clés

### Idempotence

Les handlers doivent être idempotents (ré-exécution safe) :

```typescript
// Upsert au lieu d'insert
yield * repo.upsert(catalogProduct)

// Ou check before insert
const existing = yield * repo.findById(id)
if (Option.isSome(existing)) {
  yield * Effect.logInfo('Already processed, skipping')
  return
}
```

### Retry avec state machine

```typescript
if (!SyncStatusMachine.canRetry(product.syncStatus)) {
  yield * Effect.logWarning('Max retries reached')
  return
}
```

### Logging structuré

```typescript
yield *
  Effect.logInfo('Processing event').pipe(
    Effect.annotateLogs({
      eventType: event._tag,
      productId: event.productId,
      correlationId: event.correlationId,
    }),
    Effect.withLogSpan('event-handler')
  )
```

## Checklist

- [ ] Handler idempotent (upsert ou check duplicates)
- [ ] Logging avec correlationId
- [ ] Error mapping vers `MessageHandlerError`
- [ ] State machine pour sync status si applicable
- [ ] `Effect.withLogSpan` pour traçabilité
- [ ] Ne pas throw - utiliser `Effect.fail`
