// packages/shared-kernel/src/domain/value-objects/product-enums.ts
//
// Shared enums: valeurs métier utilisées par plusieurs bounded contexts.
// Ne pas dupliquer — si un context ajoute une valeur, elle est visible partout.

import * as S from 'effect/Schema'

// ============================================
// PRODUCT CATEGORY
// ============================================

export const ProductCategory = {
  RUNNER: 'RUNNER',
  STANDARD: 'STANDARD',
} as const

export type ProductCategory = (typeof ProductCategory)[keyof typeof ProductCategory]

export const ProductCategorySchema = S.Literal('RUNNER', 'STANDARD')
export const MakeProductCategory = S.decodeUnknownSync(ProductCategorySchema)

// ============================================
// PRICE RANGE
// ============================================

export const PriceRange = {
  DISCOUNT: 'DISCOUNT',
  STANDARD: 'STANDARD',
  PREMIUM: 'PREMIUM',
} as const

export type PriceRange = (typeof PriceRange)[keyof typeof PriceRange]

export const PriceRangeSchema = S.Literal('DISCOUNT', 'STANDARD', 'PREMIUM')
export const MakePriceRange = S.decodeUnknownSync(PriceRangeSchema)

// ============================================
// SIZE
// ============================================

export const Size = {
  REGULAR: 'REGULAR',
  LARGE: 'LARGE',
  CUSTOM: 'CUSTOM',
} as const

export type Size = (typeof Size)[keyof typeof Size]

export const SizeSchema = S.Literal('REGULAR', 'LARGE', 'CUSTOM')
export const MakeSize = S.decodeUnknownSync(SizeSchema)
