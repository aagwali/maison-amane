// src/domain/pilot/aggregate.ts

import type {
  ProductId,
  VariantId,
  ProductLabel,
  ProductDescription,
  CustomDimension,
  Price,
  ProductViews,
  SyncStatus,
  ProductVariant,
  StandardVariant,
  CustomVariant,
} from "./value-objects"

import type {
  ProductType,
  ProductCategory,
  PriceRange,
  ProductStatus,
  PredefinedSize
} from "./enums"

import { Size } from "./enums"

// Re-export variant types for convenience
export type { ProductVariant, StandardVariant, CustomVariant }

// ============================================
// VARIANT CONSTRUCTORS
// ============================================

export const ProductVariantEntity = {
  createStandard: (id: VariantId, size: PredefinedSize): StandardVariant => ({
    _tag: "StandardVariant",
    id,
    size
  }),
  createCustom: (
    id: VariantId,
    customDimensions: CustomDimension,
    price: Price
  ): CustomVariant => ({
    _tag: "CustomVariant",
    id,
    size: Size.CUSTOM,
    customDimensions,
    price
  })
}

// ============================================
// PILOT PRODUCT (Aggregate Root)
// ============================================

export interface PilotProduct {
  readonly _tag: "PilotProduct"

  // Identity
  readonly id: ProductId

  // Core
  readonly label: ProductLabel
  readonly type: ProductType
  readonly category: ProductCategory
  readonly description: ProductDescription
  readonly priceRange: PriceRange

  // Collections
  readonly variants: readonly [ProductVariant, ...ProductVariant[]]
  readonly views: ProductViews

  // Status
  readonly status: ProductStatus
  readonly syncStatus: SyncStatus

  // Metadata
  readonly createdAt: Date
  readonly updatedAt: Date
}

// Constructor
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
  }): PilotProduct => ({
    _tag: "PilotProduct",
    ...params,
    syncStatus: { _tag: "NotSynced" }
  })
}
