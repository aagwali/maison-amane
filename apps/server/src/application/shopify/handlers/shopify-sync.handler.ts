// src/application/shopify/handlers/shopify-sync.handler.ts

import { Data, Effect, Option } from 'effect'

import {
  ProductStatus,
  SyncStatusMachine,
  withSyncStatus,
  type PilotProduct,
  type PilotProductPublished,
  type PilotProductUpdated,
  type ProductId,
  type ShopifyProductId,
} from '../../../domain/pilot'
import {
  Clock,
  MessageHandlerError,
  PilotProductRepository,
  ShopifyClient,
  type MessageHandler,
} from '../../../ports/driven'

// ============================================
// SHOPIFY SYNC ERROR
// ============================================

export class ShopifySyncError extends Data.TaggedError('ShopifySyncError')<{
  readonly cause: unknown
}> {}

// ============================================
// SYNC EVENT TYPE
// Both events have the same structure for sync
// ============================================

export type ShopifySyncEvent = PilotProductPublished | PilotProductUpdated

// ============================================
// SHOPIFY SYNC HANDLER
// ============================================

/**
 * Handles PilotProductPublished and PilotProductUpdated events to sync products to Shopify
 *
 * This handler:
 * - Listens to PilotProductPublished and PilotProductUpdated events from RabbitMQ
 * - Checks product status:
 *   - DRAFT: Skip sync (work in progress)
 *   - PUBLISHED: Sync to Shopify (create or update)
 *   - ARCHIVED: Archive on Shopify
 * - Updates PilotProduct syncStatus with Shopify ID
 * - On failure after max retries, marks syncStatus as SyncFailed
 */
export const shopifySyncHandler: MessageHandler<
  ShopifySyncEvent,
  PilotProductRepository | ShopifyClient | Clock
> = (event) =>
  Effect.gen(function* () {
    const { product, productId, correlationId, userId } = event

    yield* Effect.logInfo('Processing product for Shopify sync').pipe(
      Effect.annotateLogs({
        productId,
        correlationId,
        userId,
        status: product.status,
        eventType: event._tag,
      }),
      Effect.withLogSpan('shopify-sync.process')
    )

    // Check product status to determine action
    switch (product.status) {
      case ProductStatus.DRAFT:
        yield* Effect.logInfo('Product is DRAFT, skipping Shopify sync').pipe(
          Effect.annotateLogs({ productId })
        )
        return

      case ProductStatus.PUBLISHED:
        yield* syncToShopify(event, product)
        return

      case ProductStatus.ARCHIVED:
        yield* archiveOnShopify(event, product)
        return
    }
  })

// ============================================
// SYNC TO SHOPIFY (PUBLISHED status)
// ============================================

const syncToShopify = (
  event: ShopifySyncEvent,
  product: PilotProduct
): Effect.Effect<void, MessageHandlerError, PilotProductRepository | ShopifyClient | Clock> =>
  Effect.gen(function* () {
    const { productId } = event
    const shopifyClient = yield* ShopifyClient

    // Call Shopify API (adapter handles the domain → API mapping)
    const shopifyProductId = yield* shopifyClient
      .syncProduct(product)
      .pipe(Effect.mapError((error) => new MessageHandlerError({ event, cause: error })))

    yield* Effect.logInfo('Product synced to Shopify').pipe(
      Effect.annotateLogs({
        shopifyProductId,
      })
    )

    // Update PilotProduct syncStatus
    yield* updateSyncStatus(event, productId, shopifyProductId)
  })

// ============================================
// ARCHIVE ON SHOPIFY (ARCHIVED status)
// ============================================

const archiveOnShopify = (
  event: ShopifySyncEvent,
  product: PilotProduct
): Effect.Effect<void, MessageHandlerError, ShopifyClient> =>
  Effect.gen(function* () {
    const { productId } = event

    // Check if product is synced with Shopify
    if (product.syncStatus._tag !== 'Synced') {
      yield* Effect.logInfo('Product not synced to Shopify, nothing to archive').pipe(
        Effect.annotateLogs({
          productId,
          syncStatus: product.syncStatus._tag,
        })
      )
      return
    }

    const { shopifyProductId } = product.syncStatus

    yield* Effect.logInfo('Archiving product on Shopify').pipe(
      Effect.annotateLogs({
        productId,
        shopifyProductId,
      })
    )

    // Call Shopify API to archive
    const shopifyClient = yield* ShopifyClient
    yield* shopifyClient
      .archiveProduct(shopifyProductId)
      .pipe(Effect.mapError((error) => new MessageHandlerError({ event, cause: error })))

    yield* Effect.logInfo('Product archived on Shopify').pipe(
      Effect.annotateLogs({
        productId,
        shopifyProductId,
      })
    )
  })

// ============================================
// UPDATE SYNC STATUS
// ============================================

const updateSyncStatus = (
  event: ShopifySyncEvent,
  productId: ProductId,
  shopifyProductId: ShopifyProductId
): Effect.Effect<void, MessageHandlerError, PilotProductRepository | Clock> =>
  Effect.gen(function* () {
    const pilotRepo = yield* PilotProductRepository
    const clock = yield* Clock
    const now = yield* clock.now()

    const existingProduct = yield* pilotRepo
      .findById(productId)
      .pipe(Effect.mapError((error) => new MessageHandlerError({ event, cause: error })))

    if (Option.isNone(existingProduct)) {
      yield* Effect.logWarning('Product not found in repository, skipping syncStatus update').pipe(
        Effect.annotateLogs({ productId })
      )
      return
    }

    const currentProduct = existingProduct.value

    // Use state machine to transition, then aggregate method to update
    if (SyncStatusMachine.canSync(currentProduct.syncStatus)) {
      const newSyncStatus = SyncStatusMachine.markSynced(
        currentProduct.syncStatus,
        shopifyProductId,
        now
      )

      const updatedProduct = withSyncStatus(currentProduct, newSyncStatus, now)

      yield* pilotRepo
        .update(updatedProduct)
        .pipe(Effect.mapError((error) => new MessageHandlerError({ event, cause: error })))

      yield* Effect.logInfo('Updated product syncStatus to Synced').pipe(
        Effect.annotateLogs({
          productId,
          shopifyProductId,
          syncedAt: now.toISOString(),
        })
      )
    } else {
      yield* Effect.logInfo('Product already synced, skipping syncStatus update').pipe(
        Effect.annotateLogs({
          currentSyncStatus: currentProduct.syncStatus._tag,
        })
      )
    }
  })
