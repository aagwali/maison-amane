import { type Effect, gen } from 'effect/Effect'

import {
  makeNotSynced,
  makePilotProduct,
  makePilotProductPublished,
  type PilotProductCreationError,
  requiresChangeNotification,
} from '../../../domain/pilot'
import { Clock, EventPublisher, IdGenerator, PilotProductRepository } from '../../../ports/driven'
import { type ValidatedProductData, validateProductData } from '../validation'
import { createVariants } from '../mappers/variant.mapper'
import { publishEvent } from '../../shared/event-helpers'
import type { PilotProduct } from '../../../domain/pilot'
import type { PilotProductCreationCommand } from '../commands'

// #region HANDLER: CREATE PILOT PRODUCT

export const pilotProductCreationHandler = (
  command: PilotProductCreationCommand
): Effect<
  PilotProduct,
  PilotProductCreationError,
  PilotProductRepository | IdGenerator | EventPublisher | Clock
> =>
  gen(function* () {
    const validated = yield* validateProductData(command.data)

    const product = yield* createAggregate(validated)

    const repo = yield* PilotProductRepository
    const savedProduct = yield* repo.save(product)

    if (requiresChangeNotification(savedProduct)) {
      yield* emitEvent(savedProduct, command)
    }

    return savedProduct
  })

// #endregion

// #region AGGREGATE CREATION

const createAggregate = (
  validated: ValidatedProductData
): Effect<PilotProduct, never, IdGenerator | Clock> =>
  gen(function* () {
    const idGen = yield* IdGenerator
    const clock = yield* Clock

    const productId = yield* idGen.generateProductId()
    const now = yield* clock.now()
    const variants = createVariants(validated.variants)

    return makePilotProduct({
      syncStatus: makeNotSynced(),
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

// #endregion

// #region EVENT EMISSION

const emitEvent = (
  product: PilotProduct,
  command: PilotProductCreationCommand
): Effect<void, never, EventPublisher | Clock> =>
  gen(function* () {
    const clock = yield* Clock
    const now = yield* clock.now()

    const event = makePilotProductPublished({
      productId: product.id,
      product,
      correlationId: command.correlationId,
      userId: command.userId,
      timestamp: now,
    })

    yield* publishEvent(event)
  })

// #endregion
