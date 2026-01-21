// src/domain/pilot/value-objects/views.ts

import * as S from "effect/Schema"
import { ImageUrlSchema } from "./primitives"
import { ViewTypeSchema } from "../enums"

// ============================================
// PRODUCT VIEW (single view)
// ============================================

export const ProductViewSchema = S.Struct({
  viewType: ViewTypeSchema,
  imageUrl: ImageUrlSchema,
})

export type ProductView = typeof ProductViewSchema.Type

// ============================================
// PRODUCT VIEWS (structured collection)
// ============================================

export const ProductViewsSchema = S.Struct({
  front: ProductViewSchema,
  detail: ProductViewSchema,
  additional: S.Array(ProductViewSchema),
})

export type ProductViews = typeof ProductViewsSchema.Type
