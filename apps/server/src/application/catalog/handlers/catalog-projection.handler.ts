// src/application/catalog/handlers/catalog-projection.handler.ts

import { Effect } from 'effect'

import { projectToCatalog } from '../projectors/catalog-product.projector'
import { MessageHandlerError } from '../../../infrastructure/messaging/rabbitmq/consumer'
import { CatalogProductRepository } from '../../../ports/driven'

import type { MessageHandler } from "../../../infrastructure/messaging/rabbitmq/consumer"
import type { PilotProductPublished } from "../../../domain/pilot"

// ============================================
// CATALOG PROJECTION HANDLER
// ============================================

/**
 * Handles PilotProductPublished events to maintain catalog-product read model
 *
 * This handler:
 * - Listens to PilotProductPublished events from RabbitMQ
 * - Projects pilot product to catalog product (read model)
 * - Upserts to catalog_products collection
 * - Errors are automatically retried by RabbitMQ consumer with exponential backoff
 */
export const catalogProjectionHandler: MessageHandler<
  PilotProductPublished,
  CatalogProductRepository
> = (event) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Processing product publication for catalog projection").pipe(
      Effect.annotateLogs({
        productId: event.productId,
        correlationId: event.correlationId,
        userId: event.userId,
      }),
      Effect.withLogSpan("catalog-projection.process")
    )

    const product = yield* projectToCatalog(event).pipe(
      Effect.mapError((projectionError) =>
        new MessageHandlerError(event, projectionError.cause)
      ),
      Effect.tap((product) =>
        Effect.logInfo("Successfully projected product to catalog").pipe(
          Effect.annotateLogs({
            catalogProductId: product.id,
            publishedAt: product.publishedAt.toISOString(),
          })
        )
      ),
      Effect.tapError((error) =>
        Effect.logError("Failed to project product to catalog").pipe(
          Effect.annotateLogs({
            error: String(error.cause),
            productId: event.productId,
          })
        )
      )
    )
  })
