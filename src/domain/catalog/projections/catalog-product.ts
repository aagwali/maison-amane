// src/domain/catalog/projections/catalog-product.ts

import * as S from "effect/Schema"
import { case as constructor } from "effect/Data"
import {
  ProductIdSchema,
  ProductLabelSchema,
  ProductDescriptionSchema,
  ImageUrlSchema,
  PriceSchema,
  PositiveCmSchema,
  ProductCategorySchema,
  PriceRangeSchema,
} from "../../pilot"

import { TaggedSchema } from "../../shared"

// ============================================
// CATALOG VARIANT (simplified for UI)
// ============================================

const CatalogStandardVariantSchema = S.Struct({
  _tag: S.Literal("StandardVariant"),
  size: S.Literal("REGULAR", "LARGE"),
})

const CatalogCustomVariantSchema = S.Struct({
  _tag: S.Literal("CustomVariant"),
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

const CatalogProductSchema = TaggedSchema("CatalogProduct", {
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

export const MakeCatalogProduct = constructor<CatalogProduct>()
