// src/application/catalog/handlers/catalog-projection.handler.ts

import { annotateLogs, gen, logInfo, mapError, withLogSpan } from 'effect/Effect'

import { type ProjectionEvent, projectToCatalog } from '../projectors/catalog-product.projector'
import {
  CatalogProductRepository,
  MessageHandlerError,
  type MessageHandler,
} from '../../../ports/driven'

// ============================================
// CATALOG PROJECTION HANDLER
// ============================================

/**
 * Handles PilotProductPublished and PilotProductUpdated events to maintain catalog-product read model
 *
 * This handler:
 * - Listens to PilotProductPublished and PilotProductUpdated events from RabbitMQ
 * - Projects pilot product to catalog product (read model)
 * - Upserts to catalog_products collection
 * - Errors are automatically retried by RabbitMQ consumer with exponential backoff
 */
export const catalogProjectionHandler: MessageHandler<ProjectionEvent, CatalogProductRepository> = (
  event
) =>
  gen(function* () {
    const { productId, correlationId, userId } = event

    yield* logInfo('Processing product publication for catalog projection')
      .pipe(
        annotateLogs({
          productId,
          correlationId,
          userId,
        })
      )
      .pipe(withLogSpan('catalog-projection.process'))

    const catalogProduct = yield* projectToCatalog(event).pipe(
      mapError((error) => new MessageHandlerError({ event, cause: error.cause }))
    )

    yield* logInfo('Successfully projected product to catalog').pipe(
      annotateLogs({
        catalogProductId: catalogProduct.id,
        publishedAt: catalogProduct.publishedAt.toISOString(),
      })
    )
  })
