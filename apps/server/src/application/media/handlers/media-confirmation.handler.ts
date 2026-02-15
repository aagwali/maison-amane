// src/application/media/handlers/media-confirmation.handler.ts

import { annotateLogs, gen, logInfo, mapError, withLogSpan } from 'effect/Effect'

import type { DomainEvent } from '../../../domain'
import type { PilotProduct } from '../../../domain/pilot'
import { MediaRepository, MessageHandlerError, type MessageHandler } from '../../../ports/driven'

import { confirmMediaByUrls } from './confirm-media.handler'

// ============================================
// MEDIA CONFIRMATION HANDLER
// ============================================

/**
 * Type for events that this handler processes (events containing a PilotProduct)
 */
type MediaConfirmationEvent = Extract<DomainEvent, { product: PilotProduct }>

/**
 * Handles PilotProductCreated and PilotProductUpdated events to confirm referenced media
 *
 * This handler:
 * - Listens to PilotProductCreated and PilotProductUpdated events from RabbitMQ
 * - Extracts imageUrls from product views (front, detail, additional)
 * - Confirms media with matching URLs (PENDING → CONFIRMED)
 * - Is idempotent (already CONFIRMED media are skipped)
 */
export const mediaConfirmationHandler: MessageHandler<MediaConfirmationEvent, MediaRepository> = (
  event
) =>
  gen(function* () {
    const { productId, correlationId, userId } = event
    const urls = extractImageUrls(event.product)

    if (urls.length === 0) {
      yield* logInfo('No image URLs found in product, skipping media confirmation')
        .pipe(annotateLogs({ productId, correlationId, userId, eventType: event._tag }))
        .pipe(withLogSpan('media-confirmation.skip'))
      return
    }

    yield* logInfo('Confirming media for product')
      .pipe(annotateLogs({
          productId,
          correlationId,
          userId,
          eventType: event._tag,
          urlCount: urls.length,
        }))
      .pipe(withLogSpan('media-confirmation.process'))

    yield* confirmMediaByUrls(urls)
      .pipe(mapError((error) => new MessageHandlerError({ event, cause: error })))

    yield* logInfo('Media confirmation completed')
      .pipe(annotateLogs({ productId, urlCount: urls.length }))
  })

// ============================================
// HELPERS
// ============================================

/**
 * Extracts all image URLs from a product's views (front, detail, additional)
 */
const extractImageUrls = (product: PilotProduct): string[] => [
  product.views.front.imageUrl,
  product.views.detail.imageUrl,
  ...product.views.additional.map((v) => v.imageUrl),
]
