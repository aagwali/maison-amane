// src/application/pilot/handlers/update-pilot-product.handler.ts

import { Effect, Option } from 'effect'

import {
  MakePilotProduct,
  MakePilotProductUpdated,
  type PilotProduct,
  type PilotProductUpdateError,
  ProductNotFoundError,
  ProductStatus,
} from '../../../domain/pilot'
import { Clock, EventPublisher, PilotProductRepository } from '../../../ports/driven'
import { type ValidatedUpdateData, validateUpdateData } from '../validation'
import { createVariants } from '../mappers/variant.mapper'
import { publishEvent } from '../../shared/event-helpers'
import type { PilotProductUpdateCommand } from '../commands'

// ============================================
// HANDLER: UPDATE PILOT PRODUCT
// ============================================

export const handlePilotProductUpdate = (
  command: PilotProductUpdateCommand
): Effect.Effect<
  PilotProduct,
  PilotProductUpdateError,
  PilotProductRepository | EventPublisher | Clock
> =>
  Effect.gen(function* () {
    const validated = yield* validateUpdateData(command.data)

    const repo = yield* PilotProductRepository
    const existingProduct = yield* repo.findById(command.productId)

    if (Option.isNone(existingProduct)) {
      return yield* Effect.fail(new ProductNotFoundError({ productId: command.productId }))
    }

    const updatedProduct = yield* applyUpdates(existingProduct.value, validated)

    const savedProduct = yield* repo.update(updatedProduct)

    if (shouldEmitEvent(savedProduct.status)) {
      yield* emitEvent(savedProduct, command)
    }

    return savedProduct
  })

// ============================================
// SHOULD EMIT EVENT
// ============================================

const shouldEmitEvent = (status: ProductStatus): boolean =>
  status === ProductStatus.PUBLISHED || status === ProductStatus.ARCHIVED

// ============================================
// APPLY UPDATES TO AGGREGATE
// ============================================

const applyUpdates = (
  product: PilotProduct,
  validated: ValidatedUpdateData
): Effect.Effect<PilotProduct, never, Clock> =>
  Effect.gen(function* () {
    const clock = yield* Clock
    const now = yield* clock.now()

    return MakePilotProduct({
      ...product,
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
      status: Option.getOrElse(validated.status, () => product.status),
      updatedAt: now,
    })
  })

// ============================================
// EVENT EMISSION
// ============================================

const emitEvent = (
  product: PilotProduct,
  command: PilotProductUpdateCommand
): Effect.Effect<void, never, EventPublisher | Clock> =>
  Effect.gen(function* () {
    const clock = yield* Clock
    const now = yield* clock.now()

    const event = MakePilotProductUpdated({
      productId: product.id,
      product,
      correlationId: command.correlationId,
      userId: command.userId,
      timestamp: now,
    })

    yield* publishEvent(event)
  })
