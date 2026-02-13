// src/application/pilot/validation/views.schema.ts
//
// Shared validation schema for product views.
// Extracted to avoid duplication between create and update validation.

import * as S from 'effect/Schema'

import {
  flattenViews,
  MIN_VIEWS,
  type ProductView,
  ProductViewSchema,
  ProductViewsSchema,
  structureViews,
  ViewType,
} from '../../../domain/pilot'

// ============================================
// PRODUCT VIEWS INPUT SCHEMA (with business validation)
// ============================================

export const ProductViewsInputSchema = S.Array(ProductViewSchema)
  .pipe(S.filter((views): views is readonly ProductView[] => views.length >= MIN_VIEWS, {
      message: () => `Minimum ${MIN_VIEWS} views required`,
    }))
  .pipe(S.filter(
      (views): views is readonly ProductView[] => views.some((v) => v.viewType === ViewType.FRONT),
      { message: () => 'FRONT view is required' }
    ))
  .pipe(S.filter(
      (views): views is readonly ProductView[] => views.some((v) => v.viewType === ViewType.DETAIL),
      { message: () => 'DETAIL view is required' }
    ))

// ============================================
// PRODUCT VIEWS TRANSFORM SCHEMA
// ============================================

export const ProductViewsTransformSchema = S.transform(
  ProductViewsInputSchema,
  S.typeSchema(ProductViewsSchema),
  {
    strict: true,
    decode: structureViews,
    encode: flattenViews,
  }
)
