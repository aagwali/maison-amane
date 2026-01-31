// src/application/pilot/validation/product-data.schema.ts

import { Effect } from 'effect'
import * as S from 'effect/Schema'

import {
  flattenViews,
  MIN_VIEWS,
  PriceRangeSchema,
  ProductCategorySchema,
  ProductDescriptionSchema,
  ProductLabelSchema,
  ProductStatusSchema,
  ProductTypeSchema,
  type ProductView,
  ProductViewSchema,
  ProductViewsSchema,
  structureViews,
  ValidationError,
  ViewType,
} from '../../../domain/pilot'
import type { UnvalidatedProductData } from '../commands'

import { type ValidatedVariant, ValidatedVariantSchema } from './variant-input.schema'

// Re-export for convenience
export type { ValidatedVariant }

// ============================================
// PRODUCT VIEWS SCHEMA (with business validation)
// ============================================

const ProductViewsInputSchema = S.Array(ProductViewSchema).pipe(
  S.filter((views): views is readonly ProductView[] => views.length >= MIN_VIEWS, {
    message: () => `Minimum ${MIN_VIEWS} views required`,
  }),
  S.filter(
    (views): views is readonly ProductView[] => views.some((v) => v.viewType === ViewType.FRONT),
    { message: () => 'FRONT view is required' }
  ),
  S.filter(
    (views): views is readonly ProductView[] => views.some((v) => v.viewType === ViewType.DETAIL),
    { message: () => 'DETAIL view is required' }
  )
)

const ProductViewsTransformSchema = S.transform(
  ProductViewsInputSchema,
  S.typeSchema(ProductViewsSchema),
  {
    strict: true,
    decode: structureViews,
    encode: flattenViews,
  }
)

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
): Effect.Effect<ValidatedProductData, ValidationError> =>
  S.decodeUnknown(ValidatedProductDataSchema)(data).pipe(
    Effect.mapError(ValidationError.fromParseError)
  )
