// src/application/pilot/validation/product-data.schema.ts

import { type Effect, mapError } from 'effect/Effect'
import * as S from 'effect/Schema'

import {
  PriceRangeSchema,
  ProductCategorySchema,
  ProductDescriptionSchema,
  ProductLabelSchema,
  ProductStatusSchema,
  ProductTypeSchema,
  ValidationError,
} from '../../../domain/pilot'
import type { UnvalidatedProductData } from '../commands'

import { type ValidatedVariant, ValidatedVariantSchema } from './variant-input.schema'
import { ProductViewsTransformSchema } from './views.schema'

// Re-export for convenience
export type { ValidatedVariant }

// ============================================
// MAIN SCHEMA
// ============================================

const ValidatedProductDataSchema = S.Struct({
  label: ProductLabelSchema,
  type: ProductTypeSchema,
  category: ProductCategorySchema,
  description: ProductDescriptionSchema,
  priceRange: PriceRangeSchema,
  variants: S.NonEmptyArray(ValidatedVariantSchema),
  views: ProductViewsTransformSchema,
  status: ProductStatusSchema,
})

export type ValidatedProductData = typeof ValidatedProductDataSchema.Type

// ============================================
// MAIN VALIDATOR
// ============================================

export const validateProductData = (
  data: UnvalidatedProductData
): Effect<ValidatedProductData, ValidationError> =>
  S.decodeUnknown(ValidatedProductDataSchema)(data)
    .pipe(mapError(ValidationError.fromParseError))
