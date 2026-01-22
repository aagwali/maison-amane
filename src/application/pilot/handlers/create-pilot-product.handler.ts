// src/application/pilot/handlers/create-pilot-product.handler.ts

import { Effect } from "effect"
import type { PilotProduct, ProductVariant } from "../../../domain/pilot"
import {
  ProductStatus,
  type PilotProductCreationError,
  MakeStandardVariant,
  MakeCustomVariant,
  Size,
  MakePilotProduct,
  MakePilotProductPublished,
  MakeNotSynced,
} from "../../../domain/pilot"
import type { PilotProductCreationCommand } from "../commands"
import { validateProductData, type ValidatedProductData, type ValidatedVariant } from "../validation"
import {
  PilotProductRepository,
  IdGenerator,
  EventPublisher,
  Clock
} from "../../../ports/driven"

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
    const variants = yield* createVariants(validated.variants, idGen)

    return MakePilotProduct({
      _tag: "PilotProduct",
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

const createVariant = (
  v: ValidatedVariant,
  idGen: IdGenerator
): Effect.Effect<ProductVariant> =>
  Effect.gen(function* () {
    const variantId = yield* idGen.generateVariantId()
    if (v._tag === "CustomVariant") {
      return MakeCustomVariant({
        _tag: "CustomVariant",
        id: variantId,
        size: Size.CUSTOM,
        customDimensions: v.customDimensions,
        price: v.price,
      })
    }
    return MakeStandardVariant({
      _tag: "StandardVariant",
      id: variantId,
      size: v.size,
    })
  })

const createVariants = (
  validatedVariants: readonly [ValidatedVariant, ...ValidatedVariant[]],
  idGen: IdGenerator
): Effect.Effect<readonly [ProductVariant, ...ProductVariant[]]> =>
  Effect.gen(function* () {
    const [first, ...rest] = validatedVariants
    const firstVariant = yield* createVariant(first, idGen)
    const restVariants = yield* Effect.all(rest.map((v) => createVariant(v, idGen)))
    return [firstVariant, ...restVariants] as const
  })

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

    yield* publisher.publish(event)
  })
