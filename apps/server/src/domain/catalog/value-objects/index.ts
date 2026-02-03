// src/domain/catalog/value-objects/index.ts
//
// Catalog Bounded Context - Own Value Objects
// DDD: Each bounded context owns its type definitions.
// ProductId is imported from shared-kernel (cross-context identifier).

import * as S from 'effect/Schema'

// NOTE: ProductId is NOT re-exported here to avoid conflicts.
// Import ProductId directly from '@maison-amane/shared-kernel' when needed.

// ============================================
// CATALOG-SPECIFIC VALUE OBJECTS
// ============================================

// Label (display name for UI)
export const CatalogLabelSchema = S.String.pipe(
  S.trimmed(),
  S.minLength(1),
  S.maxLength(255),
  S.brand('CatalogLabel')
)
export type CatalogLabel = typeof CatalogLabelSchema.Type
export const MakeCatalogLabel = S.decodeUnknownSync(CatalogLabelSchema)

// Description (UI display)
export const CatalogDescriptionSchema = S.String.pipe(
  S.trimmed(),
  S.maxLength(2000),
  S.brand('CatalogDescription')
)
export type CatalogDescription = typeof CatalogDescriptionSchema.Type
export const MakeCatalogDescription = S.decodeUnknownSync(CatalogDescriptionSchema)

// Price (centimes, positive)
export const CatalogPriceSchema = S.Number.pipe(S.int(), S.positive(), S.brand('CatalogPrice'))
export type CatalogPrice = typeof CatalogPriceSchema.Type
export const MakeCatalogPrice = S.decodeUnknownSync(CatalogPriceSchema)

// Dimension (positive cm)
export const CatalogDimensionSchema = S.Number.pipe(
  S.int(),
  S.positive(),
  S.brand('CatalogDimension')
)
export type CatalogDimension = typeof CatalogDimensionSchema.Type
export const MakeCatalogDimension = S.decodeUnknownSync(CatalogDimensionSchema)

// Image URL (https only)
export const CatalogImageUrlSchema = S.String.pipe(
  S.pattern(/^https:\/\/.+/),
  S.brand('CatalogImageUrl')
)
export type CatalogImageUrl = typeof CatalogImageUrlSchema.Type
export const MakeCatalogImageUrl = S.decodeUnknownSync(CatalogImageUrlSchema)

// ============================================
// ENUMS (shared - cross-context, from shared-kernel)
// ============================================

export {
  ProductCategorySchema as CatalogCategorySchema,
  MakeProductCategory as MakeCatalogCategory,
  PriceRangeSchema as CatalogPriceRangeSchema,
  MakePriceRange as MakeCatalogPriceRange,
  Size,
  SizeSchema as CatalogSizeSchema,
  MakeSize as MakeCatalogSize,
} from '@maison-amane/shared-kernel'
