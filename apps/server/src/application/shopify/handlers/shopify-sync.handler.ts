// src/application/shopify/handlers/shopify-sync.handler.ts

import { Option } from 'effect'
import {
  annotateLogs,
  gen,
  logInfo,
  logWarning,
  mapError,
  withLogSpan,
  type Effect,
} from 'effect/Effect'

import {
  markSynced,
  ProductStatus,
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
// SYNC EVENT TYPE
// Both events have the same structure for sync
// ============================================

export type ShopifySyncEvent = PilotProductPublished | PilotProductUpdated

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
  gen(function* () {
    const { product, productId, correlationId, userId } = event

    yield* logInfo('Processing product for Shopify sync').pipe(
      annotateLogs({
        productId,
        correlationId,
        userId,
        status: product.status,
        eventType: event._tag,
      }),
      withLogSpan('shopify-sync.process')
    )

    switch (product.status) {
      case ProductStatus.DRAFT:
        yield* logInfo('Product is DRAFT, skipping Shopify sync').pipe(annotateLogs({ productId }))
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
): Effect<void, MessageHandlerError, PilotProductRepository | ShopifyClient | Clock> =>
  gen(function* () {
    const { productId } = event
    const shopifyClient = yield* ShopifyClient

    const shopifyProductId = yield* shopifyClient
      .syncProduct(product)
      .pipe(mapError((error) => new MessageHandlerError({ event, cause: error })))

    yield* logInfo('Product synced to Shopify').pipe(annotateLogs({ shopifyProductId }))

    yield* updateSyncStatus(event, productId, shopifyProductId)
  })

// ============================================
// ARCHIVE ON SHOPIFY (ARCHIVED status)
// ============================================

const archiveOnShopify = (
  event: ShopifySyncEvent,
  product: PilotProduct
): Effect<void, MessageHandlerError, ShopifyClient> =>
  gen(function* () {
    const { productId } = event

    if (product.syncStatus._tag !== 'Synced') {
      yield* logInfo('Product not synced to Shopify, nothing to archive').pipe(
        annotateLogs({ productId, syncStatus: product.syncStatus._tag })
      )
      return
    }

    const { shopifyProductId } = product.syncStatus

    yield* logInfo('Archiving product on Shopify').pipe(
      annotateLogs({ productId, shopifyProductId })
    )

    const shopifyClient = yield* ShopifyClient

    yield* shopifyClient
      .archiveProduct(shopifyProductId)
      .pipe(mapError((error) => new MessageHandlerError({ event, cause: error })))

    yield* logInfo('Product archived on Shopify').pipe(
      annotateLogs({ productId, shopifyProductId })
    )
  })

// ============================================
// UPDATE SYNC STATUS
// ============================================

const updateSyncStatus = (
  event: ShopifySyncEvent,
  productId: ProductId,
  shopifyProductId: ShopifyProductId
): Effect<void, MessageHandlerError, PilotProductRepository | Clock> =>
  gen(function* () {
    const pilotRepo = yield* PilotProductRepository
    const clock = yield* Clock
    const now = yield* clock.now()

    const existingProduct = yield* pilotRepo
      .findById(productId)
      .pipe(mapError((error) => new MessageHandlerError({ event, cause: error })))

    if (Option.isNone(existingProduct)) {
      yield* logWarning('Product not found in repository, skipping syncStatus update').pipe(
        annotateLogs({ productId })
      )
      return
    }

    const currentProduct = existingProduct.value

    const updatedProduct = markSynced(currentProduct, shopifyProductId, now)

    yield* pilotRepo
      .update(updatedProduct)
      .pipe(mapError((error) => new MessageHandlerError({ event, cause: error })))

    yield* logInfo('Updated product syncStatus to Synced').pipe(
      annotateLogs({ productId, shopifyProductId, syncedAt: now.toISOString() })
    )
  })
