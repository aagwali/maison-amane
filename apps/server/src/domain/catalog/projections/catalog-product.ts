// src/domain/catalog/projections/catalog-product.ts

import { Data } from 'effect'
import * as S from 'effect/Schema'

import {
  ImageUrlSchema,
  PositiveCmSchema,
  PriceRangeSchema,
  PriceSchema,
  ProductCategorySchema,
  ProductDescriptionSchema,
  ProductIdSchema,
  ProductLabelSchema,
} from '../../pilot'

// ============================================
// CATALOG VARIANT (simplified for UI)
// ============================================

const CatalogStandardVariantSchema = S.TaggedStruct("StandardVariant", {
  size: S.Literal("REGULAR", "LARGE"),
})

const CatalogCustomVariantSchema = S.TaggedStruct("CustomVariant", {
  dimensions: S.Struct({
    width: PositiveCmSchema,
    length: PositiveCmSchema,
  }),
  price: PriceSchema,
})

const CatalogVariantSchema = S.Union(
  CatalogStandardVariantSchema,
  CatalogCustomVariantSchema,
)

export type CatalogStandardVariant = typeof CatalogStandardVariantSchema.Type
export type CatalogCustomVariant = typeof CatalogCustomVariantSchema.Type
export type CatalogVariant = typeof CatalogVariantSchema.Type

// ============================================
// CATALOG PRODUCT (Read Model for UI)
// ============================================

const CatalogProductSchema = S.TaggedStruct("CatalogProduct", {
  id: ProductIdSchema,
  label: ProductLabelSchema,
  description: ProductDescriptionSchema,
  category: ProductCategorySchema,
  priceRange: PriceRangeSchema,
  variants: S.Array(CatalogVariantSchema),
  images: S.Struct({
    front: ImageUrlSchema,
    detail: ImageUrlSchema,
    gallery: S.Array(ImageUrlSchema),
  }),
  shopifyUrl: S.optional(S.String),
  publishedAt: S.Date,
})

export type CatalogProduct = typeof CatalogProductSchema.Type

export const MakeCatalogProduct = (
  params: Omit<CatalogProduct, "_tag">
): CatalogProduct => Data.case<CatalogProduct>()({ _tag: "CatalogProduct", ...params })
