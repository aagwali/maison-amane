// src/application/pilot/handlers/create-pilot-product.handler.ts

import { Effect } from 'effect'

import {
  MakeNotSynced,
  MakePilotProduct,
  MakePilotProductPublished,
  type PilotProductCreationError,
  ProductStatus,
} from '../../../domain/pilot'
import { Clock, EventPublisher, IdGenerator, PilotProductRepository } from '../../../ports/driven'
import { type ValidatedProductData, validateProductData } from '../validation'
import { createVariants } from '../mappers/variant.mapper'
import { publishEventWithRetry } from '../../shared/event-helpers'
import type { PilotProduct } from '../../../domain/pilot'
import type { PilotProductCreationCommand } from '../commands'
// ============================================
// HANDLER: CREATE PILOT PRODUCT
// ============================================

export const handlePilotProductCreation = (
  command: PilotProductCreationCommand
): Effect.Effect<
  PilotProduct,
  PilotProductCreationError,
  PilotProductRepository | IdGenerator | EventPublisher | Clock
> =>
  Effect.gen(function* () {
    const validated = yield* validateProductData(command.data)

    const product = yield* createAggregate(validated)

    const repo = yield* PilotProductRepository
    const savedProduct = yield* repo.save(product)

    if (savedProduct.status === ProductStatus.PUBLISHED) {
      yield* emitEvent(savedProduct, command)
    }

    return savedProduct
  })

// ============================================
// AGGREGATE CREATION
// ============================================

const createAggregate = (
  validated: ValidatedProductData
): Effect.Effect<PilotProduct, never, IdGenerator | Clock> =>
  Effect.gen(function* () {
    const idGen = yield* IdGenerator
    const clock = yield* Clock

    const productId = yield* idGen.generateProductId()
    const now = yield* clock.now()
    const variants = createVariants(validated.variants)

    return MakePilotProduct({
      syncStatus: MakeNotSynced(),
      id: productId,
      label: validated.label,
      type: validated.type,
      category: validated.category,
      description: validated.description,
      priceRange: validated.priceRange,
      variants,
      views: validated.views,
      status: validated.status,
      createdAt: now,
      updatedAt: now,
    })
  })

// ============================================
// EVENT EMISSION
// ============================================

const emitEvent = (
  product: PilotProduct,
  command: PilotProductCreationCommand
): Effect.Effect<void, never, EventPublisher | Clock> =>
  Effect.gen(function* () {
    const clock = yield* Clock
    const now = yield* clock.now()

    const event = MakePilotProductPublished({
      productId: product.id,
      product,
      correlationId: command.correlationId,
      userId: command.userId,
      timestamp: now,
    })

    yield* publishEventWithRetry(event)
  })
