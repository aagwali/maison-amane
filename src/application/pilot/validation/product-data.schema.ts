// src/application/pilot/validation/product-data.schema.ts

import * as S from "effect/Schema"
import { Effect } from "effect"
import {
  ValidationError,
  ProductLabelSchema,
  ProductDescriptionSchema,
  ProductViewSchema,
  ValidatedVariantSchema,
  ProductTypeSchema,
  ProductCategorySchema,
  PriceRangeSchema,
  ProductStatusSchema,
  ViewType,
  MIN_VIEWS,
  type ValidatedVariant,
  type ProductView,
  type ProductViews
} from "../../../domain/pilot"
import type { UnvalidatedProductData } from "../commands"

// Re-export for convenience
export type { ValidatedVariant }

// ============================================
// PRODUCT VIEWS SCHEMA
// ============================================

const ProductViewsInputSchema = S.Array(ProductViewSchema).pipe(
  S.filter(
    (views): views is readonly ProductView[] => views.length >= MIN_VIEWS,
    { message: () => `Minimum ${MIN_VIEWS} views required` }
  ),
  S.filter(
    (views): views is readonly ProductView[] => views.some(v => v.viewType === ViewType.FRONT),
    { message: () => "FRONT view is required" }
  ),
  S.filter(
    (views): views is readonly ProductView[] => views.some(v => v.viewType === ViewType.DETAIL),
    { message: () => "DETAIL view is required" }
  )
)

const ProductViewsSchema = S.transform(
  ProductViewsInputSchema,
  S.typeSchema(S.Any as S.Schema<ProductViews>),
  {
    strict: true,
    decode: (views): ProductViews => {
      const front = views.find(v => v.viewType === ViewType.FRONT)!
      const detail = views.find(v => v.viewType === ViewType.DETAIL)!
      const additional = views.filter(
        v => v.viewType !== ViewType.FRONT && v.viewType !== ViewType.DETAIL
      )
      return { front, detail, additional }
    },
    encode: (pv) => [pv.front, pv.detail, ...pv.additional]
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
  views: ProductViewsSchema,
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
