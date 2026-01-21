// src/domain/pilot/value-objects/primitives.ts

import * as S from "effect/Schema"

// ============================================
// PRODUCT LABEL
// ============================================

export const ProductLabelSchema = S.Trim.pipe(
  S.minLength(1),
  S.maxLength(255),
  S.brand("ProductLabel"),
)
export type ProductLabel = typeof ProductLabelSchema.Type
export const MakeProductLabel = S.decodeUnknownSync(ProductLabelSchema)

// ============================================
// PRODUCT DESCRIPTION
// ============================================

export const ProductDescriptionSchema = S.String.pipe(
  S.maxLength(5000),
  S.brand("ProductDescription"),
)
export type ProductDescription = typeof ProductDescriptionSchema.Type
export const MakeProductDescription = S.decodeUnknownSync(ProductDescriptionSchema)

// ============================================
// PRICE (in centimes)
// ============================================

export const PriceSchema = S.Number.pipe(
  S.int(),
  S.positive(),
  S.brand("Price"),
)
export type Price = typeof PriceSchema.Type
export const MakePrice = S.decodeUnknownSync(PriceSchema)

// ============================================
// POSITIVE CM (for dimensions)
// ============================================

export const PositiveCmSchema = S.Number.pipe(
  S.int(),
  S.positive(),
  S.brand("PositiveCm"),
)
export type PositiveCm = typeof PositiveCmSchema.Type
export const MakePositiveCm = S.decodeUnknownSync(PositiveCmSchema)

// ============================================
// IMAGE URL
// ============================================

export const ImageUrlSchema = S.String.pipe(
  S.pattern(/^https:\/\/.+/),
  S.brand("ImageUrl"),
)
export type ImageUrl = typeof ImageUrlSchema.Type
export const MakeImageUrl = S.decodeUnknownSync(ImageUrlSchema)
