// src/domain/pilot/aggregate.ts

import * as S from "effect/Schema"
import { case as constructor } from "effect/Data"
import {
  ProductIdSchema,
  ProductLabelSchema,
  ProductDescriptionSchema,
  ProductViewsSchema,
  ProductVariantSchema,
  SyncStatusSchema,
  MakeNotSynced,
  type ProductId,
  type VariantId,
  type ProductLabel,
  type ProductDescription,
  type CustomDimension,
  type Price,
  type ProductViews,
  type ProductVariant,
  type StandardVariant,
  type CustomVariant,
} from "./value-objects"

import {
  ProductTypeSchema,
  ProductCategorySchema,
  PriceRangeSchema,
  ProductStatusSchema,
  Size,
  type ProductType,
  type ProductCategory,
  type PriceRange,
  type ProductStatus,
  type PredefinedSize,
} from "./enums"

import { TaggedSchema } from "../shared"

// Re-export variant types for convenience
export type { ProductVariant, StandardVariant, CustomVariant }

// ============================================
// VARIANT CONSTRUCTORS
// ============================================

export const MakeStandardVariant = constructor<StandardVariant>()
export const MakeCustomVariant = constructor<CustomVariant>()

// ============================================
// PILOT PRODUCT (Aggregate Root)
// ============================================

const VariantsNonEmptySchema = S.NonEmptyArray(ProductVariantSchema)

const PilotProductSchema = TaggedSchema("PilotProduct", {
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

export const MakePilotProduct = constructor<PilotProduct>()

export const PilotProductAggregate = {
  create: (params: {
    id: ProductId
    label: ProductLabel
    type: ProductType
    category: ProductCategory
    description: ProductDescription
    priceRange: PriceRange
    variants: readonly [ProductVariant, ...ProductVariant[]]
    views: ProductViews
    status: ProductStatus
    createdAt: Date
    updatedAt: Date
  }): PilotProduct =>
    MakePilotProduct({
      ...params,
      syncStatus: MakeNotSynced({}),
    }),
}
