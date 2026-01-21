// src/domain/catalog/projections/catalog-product.ts

import type {
  ProductId,
  ProductLabel,
  ProductDescription,
  ImageUrl,
  Price,
  PositiveCm
} from "../../pilot"

import type {
  ProductCategory,
  PriceRange
} from "../../pilot"

// ============================================
// CATALOG VARIANT (simplified for UI)
// ============================================

export interface CatalogStandardVariant {
  readonly _tag: "StandardVariant"
  readonly size: "STANDARD" | "LARGE"
}

export interface CatalogCustomVariant {
  readonly _tag: "CustomVariant"
  readonly dimensions: {
    readonly width: PositiveCm
    readonly length: PositiveCm
  }
  readonly price: Price
}

export type CatalogVariant = CatalogStandardVariant | CatalogCustomVariant

// ============================================
// CATALOG PRODUCT (Read Model for UI)
// ============================================

export interface CatalogProduct {
  readonly _tag: "CatalogProduct"

  // Identity (same as PilotProduct)
  readonly id: ProductId

  // Core (simplified for display)
  readonly label: ProductLabel
  readonly description: ProductDescription
  readonly category: ProductCategory
  readonly priceRange: PriceRange

  // Variants (simplified)
  readonly variants: readonly CatalogVariant[]

  // Images (flattened for easy UI consumption)
  readonly images: {
    readonly front: ImageUrl
    readonly detail: ImageUrl
    readonly gallery: readonly ImageUrl[]
  }

  // Shopify integration (optional, present after sync)
  readonly shopifyUrl?: string

  // Metadata
  readonly publishedAt: Date
}

// ============================================
// FACTORY
// ============================================

export const CatalogProduct = {
  create: (params: Omit<CatalogProduct, "_tag">): CatalogProduct => ({
    _tag: "CatalogProduct",
    ...params
  })
}
