// src/application/pilot/handlers/create-pilot-product.handler.ts

import { Effect } from 'effect'

import {
  MakeCustomVariant,
  MakeNotSynced,
  MakePilotProduct,
  MakePilotProductPublished,
  MakeStandardVariant,
  type PilotProductCreationError,
  ProductStatus,
  Size,
} from '../../../domain/pilot'
import {
  Clock,
  EventPublisher,
  IdGenerator,
  PilotProductRepository,
} from '../../../ports/driven'
import {
  type ValidatedProductData,
  type ValidatedVariant,
  validateProductData,
} from '../validation'

import type { PilotProduct, ProductVariant } from "../../../domain/pilot"
import type { PilotProductCreationCommand } from "../commands"
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

const createVariant = (v: ValidatedVariant): ProductVariant => {
  if (v._tag === "CustomVariant") {
    return MakeCustomVariant({
      size: Size.CUSTOM,
      customDimensions: v.customDimensions,
      price: v.price,
    })
  }
  return MakeStandardVariant({
    size: v.size,
  })
}

const createVariants = (
  validatedVariants: readonly [ValidatedVariant, ...ValidatedVariant[]]
): readonly [ProductVariant, ...ProductVariant[]] => {
  const [first, ...rest] = validatedVariants
  return [createVariant(first), ...rest.map(createVariant)] as const
}

// ============================================
// EVENT EMISSION
// ============================================

const emitEvent = (
  product: PilotProduct,
  command: PilotProductCreationCommand
): Effect.Effect<void, never, EventPublisher | Clock> =>
  Effect.gen(function* () {
    const publisher = yield* EventPublisher
    const clock = yield* Clock
    const now = yield* clock.now()

    const event = MakePilotProductPublished({
      productId: product.id,
      product,
      correlationId: command.correlationId,
      userId: command.userId,
      timestamp: now,
    })

    // Log error but don't fail the command - event will be retried by message broker
    yield* publisher.publish(event).pipe(
      Effect.catchAll((error) =>
        Effect.logError("Failed to publish event, will be retried").pipe(
          Effect.annotateLogs({ error: String(error.cause) })
        )
      )
    )
  })
