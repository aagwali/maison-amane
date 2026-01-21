// src/application/pilot/use-cases/create-pilot-product.use-case.ts

import { Effect, pipe } from "effect"
import type { PilotProduct, ProductVariant } from "../../../domain/pilot"
import {
  PilotProductAggregate,
  ProductVariantEntity,
  PilotProductPublished,
  ProductStatus,
  type CreateProductError
} from "../../../domain/pilot"
import type { CreatePilotProductCommand } from "../commands"
import { validateProductData, type ValidatedProductData, type ValidatedVariant } from "../validation"
import {
  PilotProductRepository,
  IdGenerator,
  EventPublisher,
  Clock
} from "../../../ports/driven"

// ============================================
// USE CASE: CREATE PILOT PRODUCT
// ============================================

export const createPilotProduct = (
  command: CreatePilotProductCommand
): Effect.Effect<
  PilotProduct,
  CreateProductError,
  PilotProductRepository | IdGenerator | EventPublisher | Clock
> =>
  pipe(
    // Step 1: Validate
    validateProductData(command.data),

    // Step 2: Create Aggregate
    Effect.flatMap((validated) =>
      createAggregate(validated)
    ),

    // Step 3: Persist
    Effect.flatMap((product) =>
      pipe(
        PilotProductRepository,
        Effect.flatMap((repo) => repo.save(product))
      )
    ),

    // Step 4: Emit Event (if PUBLISHED)
    Effect.tap((product) =>
      product.status === ProductStatus.PUBLISHED
        ? emitEvent(product, command)
        : Effect.succeed(undefined)
    )
  )

// ============================================
// STEP 2: CREATE AGGREGATE
// ============================================

const createAggregate = (
  validated: ValidatedProductData
): Effect.Effect<PilotProduct, never, IdGenerator | Clock> =>
  pipe(
    Effect.all({
      idGen: IdGenerator,
      clock: Clock
    }),
    Effect.flatMap(({ idGen, clock }) =>
      pipe(
        Effect.all({
          productId: idGen.generateProductId(),
          now: clock.now()
        }),
        Effect.flatMap(({ productId, now }) =>
          pipe(
            createVariants(validated.variants, idGen),
            Effect.map((variants) =>
              PilotProductAggregate.create({
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
                updatedAt: now
              })
            )
          )
        )
      )
    )
  )

const createVariants = (
  validatedVariants: readonly [ValidatedVariant, ...ValidatedVariant[]],
  idGen: IdGenerator
): Effect.Effect<readonly [ProductVariant, ...ProductVariant[]]> =>
  pipe(
    Effect.all(
      validatedVariants.map((v) =>
        pipe(
          idGen.generateVariantId(),
          Effect.map((variantId): ProductVariant => {
            if (v._tag === "CustomVariant") {
              return ProductVariantEntity.createCustom(variantId, v.customDimensions, v.price)
            } else {
              return ProductVariantEntity.createStandard(variantId, v.size)
            }
          })
        )
      )
    ),
    Effect.map((variants) => variants as unknown as readonly [ProductVariant, ...ProductVariant[]])
  )

// ============================================
// STEP 4: EMIT EVENT
// ============================================

const emitEvent = (
  product: PilotProduct,
  command: CreatePilotProductCommand
): Effect.Effect<void, never, EventPublisher | Clock> =>
  pipe(
    Effect.all({
      publisher: EventPublisher,
      clock: Clock
    }),
    Effect.flatMap(({ publisher, clock }) =>
      pipe(
        clock.now(),
        Effect.flatMap((now) => {
          const event = PilotProductPublished.create(
            product,
            command.correlationId,
            command.userId,
            now
          )
          return publisher.publish(event)
        })
      )
    )
  )
