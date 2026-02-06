// src/domain/pilot/aggregate.ts
//
// ============================================
// DDD: AGGREGATE ROOT
// ============================================
//
// The aggregate is the guardian of INVARIANTS - rules that must always be true
// for the entity to be in a valid state. Methods on the aggregate should:
//
//   1. Validate that the operation is allowed (guard/precondition)
//   2. Apply the change
//   3. Return the new state or fail with a domain error
//
// Examples of invariants you might add here:
//
//   - "A PUBLISHED product cannot return to DRAFT"
//   - "variants must contain at least one item" (already enforced by NonEmptyArray)
//   - "syncStatus can only be Synced if status is PUBLISHED"
//
// Pattern for adding behavior:
//
//   export const publishProduct = (
//     product: PilotProduct
//   ): Effect.Effect<PilotProduct, InvariantViolation> =>
//     product.views.additional.length < 2
//       ? Effect.fail(new InvariantViolation("Min 2 additional views to publish"))
//       : Effect.succeed({ ...product, status: ProductStatus.PUBLISHED })
//
// ============================================

import { Data } from 'effect'
import * as S from 'effect/Schema'

import { type CustomVariant, ProductVariantSchema, type StandardVariant } from './value-objects'
import {
  PriceRangeSchema,
  ProductCategorySchema,
  ProductStatusSchema,
  ProductTypeSchema,
} from './enums'
import {
  ProductDescriptionSchema,
  ProductIdSchema,
  ProductLabelSchema,
  ProductViewsSchema,
  SyncStatusSchema,
} from './value-objects'

// ============================================
// VARIANT CONSTRUCTORS
// ============================================

export const makeStandardVariant = (params: Omit<StandardVariant, '_tag'>): StandardVariant =>
  Data.case<StandardVariant>()({ _tag: 'StandardVariant', ...params })

export const makeCustomVariant = (params: Omit<CustomVariant, '_tag'>): CustomVariant =>
  Data.case<CustomVariant>()({ _tag: 'CustomVariant', ...params })

// ============================================
// PILOT PRODUCT (Aggregate Root)
// ============================================

const VariantsNonEmptySchema = S.NonEmptyArray(ProductVariantSchema)

export const PilotProductSchema = S.TaggedStruct('PilotProduct', {
  id: ProductIdSchema,
  label: ProductLabelSchema,
  type: ProductTypeSchema,
  category: ProductCategorySchema,
  description: ProductDescriptionSchema,
  priceRange: PriceRangeSchema,
  variants: VariantsNonEmptySchema,
  views: ProductViewsSchema,
  status: ProductStatusSchema,
  syncStatus: SyncStatusSchema,
  createdAt: S.Date,
  updatedAt: S.Date,
})

export type PilotProduct = typeof PilotProductSchema.Type

export const makePilotProduct = (params: Omit<PilotProduct, '_tag'>): PilotProduct =>
  Data.case<PilotProduct>()({ _tag: 'PilotProduct', ...params })

// ============================================
// AGGREGATE METHODS
// ============================================

/**
 * Creates a new PilotProduct with updated syncStatus.
 * This is the proper way to update aggregate state - through a method
 * that returns a new instance rather than mutating externally.
 */
export const withSyncStatus = (
  product: PilotProduct,
  syncStatus: PilotProduct['syncStatus'],
  updatedAt: Date
): PilotProduct =>
  makePilotProduct({
    ...product,
    syncStatus,
    updatedAt,
  })

/**
 * Creates a new PilotProduct with updated fields.
 * Only the provided fields are updated; others remain unchanged.
 */
export const withUpdatedFields = (
  product: PilotProduct,
  updates: Partial<
    Pick<
      PilotProduct,
      'label' | 'type' | 'category' | 'description' | 'priceRange' | 'variants' | 'views' | 'status'
    >
  >,
  updatedAt: Date
): PilotProduct =>
  makePilotProduct({
    ...product,
    ...updates,
    updatedAt,
  })
