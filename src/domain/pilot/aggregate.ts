// src/domain/pilot/aggregate.ts

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