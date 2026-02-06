// src/domain/catalog/projections/catalog-product.ts
//
// DDD: Catalog bounded context owns its projection types.
// Only ProductId is shared (cross-context identifier from shared-kernel).

import { Data } from 'effect'
import * as S from 'effect/Schema'
import { ProductIdSchema } from '@maison-amane/shared-kernel'

import {
  CatalogDescriptionSchema,
  CatalogDimensionSchema,
  CatalogImageUrlSchema,
  CatalogLabelSchema,
  CatalogPriceRangeSchema,
  CatalogPriceSchema,
  CatalogCategorySchema,
  Size,
} from '../value-objects'

// ============================================
// CATALOG VARIANT (simplified for UI)
// ============================================

const CatalogStandardVariantSchema = S.TaggedStruct('StandardVariant', {
  size: S.Literal(Size.REGULAR, Size.LARGE),
})

const CatalogCustomVariantSchema = S.TaggedStruct('CustomVariant', {
  size: S.Literal(Size.CUSTOM),
  dimensions: S.Struct({
    width: CatalogDimensionSchema,
    length: CatalogDimensionSchema,
  }),
  price: CatalogPriceSchema,
})

const CatalogVariantSchema = S.Union(CatalogStandardVariantSchema, CatalogCustomVariantSchema)

export type CatalogStandardVariant = typeof CatalogStandardVariantSchema.Type
export type CatalogCustomVariant = typeof CatalogCustomVariantSchema.Type
export type CatalogVariant = typeof CatalogVariantSchema.Type

// ============================================
// CATALOG PRODUCT (Read Model for UI)
// ============================================

const CatalogProductSchema = S.TaggedStruct('CatalogProduct', {
  id: ProductIdSchema,
  label: CatalogLabelSchema,
  description: CatalogDescriptionSchema,
  category: CatalogCategorySchema,
  priceRange: CatalogPriceRangeSchema,
  variants: S.Array(CatalogVariantSchema),
  images: S.Struct({
    front: CatalogImageUrlSchema,
    detail: CatalogImageUrlSchema,
    gallery: S.Array(CatalogImageUrlSchema),
  }),
  shopifyUrl: S.optional(S.String),
  publishedAt: S.Date,
})

export type CatalogProduct = typeof CatalogProductSchema.Type

export const makeCatalogProduct = (params: Omit<CatalogProduct, '_tag'>): CatalogProduct =>
  Data.case<CatalogProduct>()({ _tag: 'CatalogProduct', ...params })
