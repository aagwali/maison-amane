// src/application/shopify/handlers/shopify-sync.handler.ts

import { Data, Effect, Option } from 'effect'

import {
  SyncStatusMachine,
  type PilotProductPublished,
  type ShopifyProductId,
} from '../../../domain/pilot'
import { MessageHandlerError } from '../../../infrastructure/messaging/rabbitmq/consumer'
import {
  PilotProductRepository,
  ShopifyClient,
  ShopifyClientError,
} from '../../../ports/driven'
import { mapToShopifyProduct } from '../mappers'

import type { MessageHandler } from "../../../infrastructure/messaging/rabbitmq/consumer"

// ============================================
// SHOPIFY SYNC ERROR
// ============================================

export class ShopifySyncError extends Data.TaggedError("ShopifySyncError")<{
  readonly cause: unknown
}> {}

// ============================================
// SHOPIFY SYNC HANDLER
// ============================================

/**
 * Handles PilotProductPublished events to sync products to Shopify
 *
 * This handler:
 * - Listens to PilotProductPublished events from RabbitMQ
 * - Maps pilot product to Shopify ProductSetInput
 * - Calls Shopify API to create/update product
 * - Updates PilotProduct syncStatus with Shopify ID
 * - On failure after max retries, marks syncStatus as SyncFailed
 */
export const shopifySyncHandler: MessageHandler<
  PilotProductPublished,
  PilotProductRepository | ShopifyClient
> = (event) =>
    Effect.gen(function* () {
      const { product, productId, correlationId, userId } = event

      yield* Effect.logInfo("Processing product publication for Shopify sync").pipe(
        Effect.annotateLogs({
          productId,
          correlationId,
          userId,
        }),
        Effect.withLogSpan("shopify-sync.process")
      )

      // 1. Map to Shopify input
      const shopifyInput = mapToShopifyProduct(product)

      yield* Effect.logDebug("Mapped product to Shopify format").pipe(
        Effect.annotateLogs({
          handle: shopifyInput.handle,
          variantsCount: shopifyInput.variants.length,
        })
      )

      // 2. Call Shopify API
      const shopifyClient = yield* ShopifyClient
      const response = yield* shopifyClient.productSet(shopifyInput).pipe(
        Effect.mapError((error) =>
          new MessageHandlerError({ event, cause: error })
        )
      )

      // 3. Check for Shopify user errors
      if (response.userErrors.length > 0) {
        const errorMessages = response.userErrors
          .map((e) => `${e.field.join(".")}: ${e.message}`)
          .join("; ")

        yield* Effect.logError("Shopify API returned user errors").pipe(
          Effect.annotateLogs({
            errors: errorMessages,
          })
        )

        return yield* Effect.fail(
          new MessageHandlerError({
            event,
            cause: new ShopifyClientError({
              operation: "productSet",
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
              operation: "productSet",
              cause: "No product returned from Shopify",
            }),
          })
        )
      }

      const shopifyProductId = response.product.id as ShopifyProductId

      yield* Effect.logInfo("Product synced to Shopify").pipe(
        Effect.annotateLogs({
          shopifyProductId,
        })
      )

      // 4. Update PilotProduct syncStatus
      const pilotRepo = yield* PilotProductRepository
      const now = new Date()

      const existingProduct = yield* pilotRepo.findById(productId).pipe(
        Effect.mapError((error) =>
          new MessageHandlerError({ event, cause: error })
        )
      )

      if (Option.isNone(existingProduct)) {
        yield* Effect.logWarning("Product not found in repository, skipping syncStatus update").pipe(
          Effect.annotateLogs({ productId })
        )
      } else {
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

          yield* pilotRepo.update(updatedProduct).pipe(
            Effect.mapError((error) =>
              new MessageHandlerError({ event, cause: error })
            )
          )

          yield* Effect.logInfo("Updated product syncStatus to Synced").pipe(
            Effect.annotateLogs({
              productId,
              shopifyProductId,
              syncedAt: now.toISOString(),
            })
          )
        } else {
          yield* Effect.logInfo("Product already synced, skipping syncStatus update").pipe(
            Effect.annotateLogs({
              currentSyncStatus: currentProduct.syncStatus._tag,
            })
          )
        }
      }
    })
