// src/domain/pilot/value-objects/scalar-types.ts

import * as S from 'effect/Schema'

// ============================================
// CONSTRAINTS
// ============================================

const LABEL_MAX_LENGTH = 255
const DESCRIPTION_MAX_LENGTH = 5000

// ============================================
// PRODUCT LABEL
// ============================================

export const ProductLabelSchema = S.Trim.pipe(
  S.minLength(1),
  S.maxLength(LABEL_MAX_LENGTH),
  S.brand('ProductLabel')
)
export type ProductLabel = typeof ProductLabelSchema.Type
export const makeProductLabel = S.decodeUnknownSync(ProductLabelSchema)

// ============================================
// PRODUCT DESCRIPTION
// ============================================

export const ProductDescriptionSchema = S.String.pipe(
  S.maxLength(DESCRIPTION_MAX_LENGTH),
  S.brand('ProductDescription')
)
export type ProductDescription = typeof ProductDescriptionSchema.Type
export const makeProductDescription = S.decodeUnknownSync(ProductDescriptionSchema)

// ============================================
// PRICE (in centimes)
// ============================================

export const PriceSchema = S.Number.pipe(S.int(), S.positive(), S.brand('Price'))
export type Price = typeof PriceSchema.Type
export const makePrice = S.decodeUnknownSync(PriceSchema)

// ============================================
// POSITIVE CM (for dimensions)
// ============================================

export const PositiveCmSchema = S.Number.pipe(S.int(), S.positive(), S.brand('PositiveCm'))
export type PositiveCm = typeof PositiveCmSchema.Type
export const makePositiveCm = S.decodeUnknownSync(PositiveCmSchema)

// ============================================
// IMAGE URL
// ============================================

export const ImageUrlSchema = S.String.pipe(S.pattern(/^https:\/\/.+/), S.brand('ImageUrl'))
export type ImageUrl = typeof ImageUrlSchema.Type
export const makeImageUrl = S.decodeUnknownSync(ImageUrlSchema)
