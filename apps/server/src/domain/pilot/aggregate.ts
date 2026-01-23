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

import * as S from "effect/Schema"
import { Data } from "effect"
import {
  ProductIdSchema,
  ProductLabelSchema,
  ProductDescriptionSchema,
  ProductViewsSchema,
  SyncStatusSchema,
} from "./value-objects"

import {
  ProductVariantSchema,
  type StandardVariant,
  type CustomVariant,
} from "./entities"

import {
  ProductTypeSchema,
  ProductCategorySchema,
  PriceRangeSchema,
  ProductStatusSchema,
} from "./enums"

// ============================================
// VARIANT CONSTRUCTORS
// ============================================

export const MakeStandardVariant = Data.case<StandardVariant>()
export const MakeCustomVariant = Data.case<CustomVariant>()

// ============================================
// PILOT PRODUCT (Aggregate Root)
// ============================================

const VariantsNonEmptySchema = S.NonEmptyArray(ProductVariantSchema)

const PilotProductSchema = S.TaggedStruct("PilotProduct", {
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

export const MakePilotProduct = Data.case<PilotProduct>()