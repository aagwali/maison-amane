// src/application/shopify/handlers/shopify-sync.handler.ts

import { Data, Effect, Option } from 'effect'

import {
  ProductStatus,
  SyncStatusMachine,
  type PilotProduct,
  type PilotProductPublished,
  type PilotProductUpdated,
  type ProductId,
  type ShopifyProductId,
} from '../../../domain/pilot'
import { MessageHandlerError } from '../../../infrastructure/messaging/rabbitmq/consumer'
import { PilotProductRepository, ShopifyClient, ShopifyClientError } from '../../../ports/driven'
import { mapToShopifyProduct } from '../mappers'
import type { MessageHandler } from '../../../infrastructure/messaging/rabbitmq/consumer'

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
  PilotProductRepository | ShopifyClient
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
): Effect.Effect<void, MessageHandlerError, PilotProductRepository | ShopifyClient> =>
  Effect.gen(function* () {
    const { productId } = event

    // 1. Map to Shopify input
    const shopifyInput = mapToShopifyProduct(product)

    yield* Effect.logDebug('Mapped product to Shopify format').pipe(
      Effect.annotateLogs({
        handle: shopifyInput.handle,
        variantsCount: shopifyInput.variants.length,
      })
    )

    // 2. Call Shopify API
    const shopifyClient = yield* ShopifyClient
    const response = yield* shopifyClient
      .productSet(shopifyInput)
      .pipe(Effect.mapError((error) => new MessageHandlerError({ event, cause: error })))

    // 3. Check for Shopify user errors
    if (response.userErrors.length > 0) {
      const errorMessages = response.userErrors
        .map((e) => `${e.field.join('.')}: ${e.message}`)
        .join('; ')

      yield* Effect.logError('Shopify API returned user errors').pipe(
        Effect.annotateLogs({
          errors: errorMessages,
        })
      )

      return yield* Effect.fail(
        new MessageHandlerError({
          event,
          cause: new ShopifyClientError({
            operation: 'productSet',
            cause: errorMessages,
          }),
        })
      )
    }

    if (!response.product) {
      return yield* Effect.fail(
        new MessageHandlerError({
          event,
          cause: new ShopifyClientError({
            operation: 'productSet',
            cause: 'No product returned from Shopify',
          }),
        })
      )
    }

    const shopifyProductId = response.product.id as ShopifyProductId

    yield* Effect.logInfo('Product synced to Shopify').pipe(
      Effect.annotateLogs({
        shopifyProductId,
      })
    )

    // 4. Update PilotProduct syncStatus
    yield* updateSyncStatus(event, productId, shopifyProductId)
  })

// ============================================
// ARCHIVE ON SHOPIFY (ARCHIVED status)
// ============================================

const archiveOnShopify = (
  event: ShopifySyncEvent,
  product: PilotProduct
): Effect.Effect<void, MessageHandlerError, PilotProductRepository | ShopifyClient> =>
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

    // Call Shopify API to archive (set status to ARCHIVED)
    const shopifyClient = yield* ShopifyClient
    yield* shopifyClient
      .productArchive(shopifyProductId)
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
): Effect.Effect<void, MessageHandlerError, PilotProductRepository> =>
  Effect.gen(function* () {
    const pilotRepo = yield* PilotProductRepository
    const now = new Date()

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

    // Use state machine to transition
    if (SyncStatusMachine.canSync(currentProduct.syncStatus)) {
      const updatedSyncStatus = SyncStatusMachine.markSynced(
        currentProduct.syncStatus,
        shopifyProductId,
        now
      )

      const updatedProduct = {
        ...currentProduct,
        syncStatus: updatedSyncStatus,
        updatedAt: now,
      }

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
