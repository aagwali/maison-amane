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
  CatalogMaterialSchema,
  CatalogShapeSchema,
} from '../value-objects'

// ============================================
// CATALOG VARIANT (compositional model)
// ============================================

const CatalogSizeCatalogSchema = S.Struct({
  _tag: S.Literal('CatalogSize'),
  size: S.Literal('EXTRA_SMALL', 'SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE'),
})

const CatalogBespokeSizeSchema = S.Struct({
  _tag: S.Literal('BespokeSize'),
  width: CatalogDimensionSchema,
  length: CatalogDimensionSchema,
})

const CatalogVariantSizeSchema = S.Union(CatalogSizeCatalogSchema, CatalogBespokeSizeSchema)

const CatalogFormulaPricingSchema = S.Struct({ _tag: S.Literal('FormulaPrice') })

const CatalogNegotiatedPricingSchema = S.Struct({
  _tag: S.Literal('NegotiatedPrice'),
  amount: S.Number,
})

const CatalogVariantPricingSchema = S.Union(
  CatalogFormulaPricingSchema,
  CatalogNegotiatedPricingSchema
)

const CatalogVariantSchema = S.Struct({
  sizeSpec: CatalogVariantSizeSchema,
  pricingSpec: CatalogVariantPricingSchema,
})

export type CatalogVariant = typeof CatalogVariantSchema.Type

// ============================================
// CATALOG PRODUCT (Read Model for UI)
// ============================================

const CatalogProductSchema = S.TaggedStruct('CatalogProduct', {
  id: ProductIdSchema,
  label: CatalogLabelSchema,
  description: CatalogDescriptionSchema,
  shape: CatalogShapeSchema,
  material: CatalogMaterialSchema,
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
