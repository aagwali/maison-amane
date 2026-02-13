// src/application/pilot/handlers/update-pilot-product.handler.ts

import { Option } from 'effect'
import { type Effect, gen, fail } from 'effect/Effect'

import {
  archive,
  makePilotProductUpdated,
  ProductStatus,
  publish,
  requiresChangeNotification,
  withUpdatedFields,
  type PilotProduct,
  type PilotProductUpdateError,
  ProductNotFoundError,
} from '../../../domain/pilot'
import { Clock, EventPublisher, PilotProductRepository } from '../../../ports/driven'
import type { ArchiveNotAllowed, PublicationNotAllowed } from '../../../domain/pilot/errors'
import { type ValidatedUpdateData, validateUpdateData } from '../validation'
import { createVariants } from '../mappers/variant.mapper'
import { publishEvent } from '../../shared/event-helpers'
import type { PilotProductUpdateCommand } from '../commands'

// ============================================
// HANDLER: UPDATE PILOT PRODUCT
// ============================================

export const handlePilotProductUpdate = (
  command: PilotProductUpdateCommand
): Effect<PilotProduct, PilotProductUpdateError, PilotProductRepository | EventPublisher | Clock> =>
  gen(function* () {
    const validated = yield* validateUpdateData(command.data)

    const repo = yield* PilotProductRepository
    const existingProduct = yield* repo.findById(command.productId)

    if (Option.isNone(existingProduct)) {
      return yield* fail(new ProductNotFoundError({ productId: command.productId }))
    }

    const updatedProduct = yield* applyUpdates(existingProduct.value, validated)

    const savedProduct = yield* repo.update(updatedProduct)

    if (requiresChangeNotification(savedProduct)) {
      yield* emitEvent(savedProduct, command)
    }

    return savedProduct
  })

// ============================================
// APPLY UPDATES TO AGGREGATE
// ============================================

const applyUpdates = (
  product: PilotProduct,
  validated: ValidatedUpdateData
): Effect<PilotProduct, PublicationNotAllowed | ArchiveNotAllowed, Clock> =>
  gen(function* () {
    const clock = yield* Clock
    const now = yield* clock.now()

    const updated = withUpdatedFields(
      product,
      {
        label: Option.getOrElse(validated.label, () => product.label),
        type: Option.getOrElse(validated.type, () => product.type),
        category: Option.getOrElse(validated.category, () => product.category),
        description: Option.getOrElse(validated.description, () => product.description),
        priceRange: Option.getOrElse(validated.priceRange, () => product.priceRange),
        variants: Option.match(validated.variants, {
          onNone: () => product.variants,
          onSome: (v) => createVariants(v),
        }),
        views: Option.getOrElse(validated.views, () => product.views),
      },
      now
    )

    // Apply status transition through aggregate methods
    if (Option.isNone(validated.status)) {
      return updated
    }

    const newStatus = validated.status.value
    if (newStatus === ProductStatus.PUBLISHED) {
      return yield* publish(updated, now)
    }
    if (newStatus === ProductStatus.ARCHIVED) {
      return yield* archive(updated, now)
    }

    return updated
  })

// ============================================
// EVENT EMISSION
// ============================================

const emitEvent = (
  product: PilotProduct,
  command: PilotProductUpdateCommand
): Effect<void, never, EventPublisher | Clock> =>
  gen(function* () {
    const clock = yield* Clock
    const now = yield* clock.now()

    const event = makePilotProductUpdated({
      productId: product.id,
      product,
      correlationId: command.correlationId,
      userId: command.userId,
      timestamp: now,
    })

    yield* publishEvent(event)
  })
