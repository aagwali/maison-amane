// src/domain/pilot/value-objects/variants.ts

import * as S from "effect/Schema"
import { VariantIdSchema } from "./ids"
import { PriceSchema } from "./primitives"
import { CustomDimensionSchema } from "./dimensions"
import { Size } from "../enums"

// ============================================
// STANDARD VARIANT (entity with id)
// ============================================

export const StandardVariantSchema = S.Struct({
  _tag: S.Literal("StandardVariant"),
  id: VariantIdSchema,
  size: S.Literal(Size.REGULAR, Size.LARGE),
})

export type StandardVariant = typeof StandardVariantSchema.Type

// ============================================
// CUSTOM VARIANT (entity with id)
// ============================================

export const CustomVariantSchema = S.Struct({
  _tag: S.Literal("CustomVariant"),
  id: VariantIdSchema,
  size: S.Literal(Size.CUSTOM),
  customDimensions: CustomDimensionSchema,
  price: PriceSchema,
})

export type CustomVariant = typeof CustomVariantSchema.Type

// ============================================
// PRODUCT VARIANT (union)
// ============================================

export const ProductVariantSchema = S.Union(StandardVariantSchema, CustomVariantSchema)

export type ProductVariant = typeof ProductVariantSchema.Type
