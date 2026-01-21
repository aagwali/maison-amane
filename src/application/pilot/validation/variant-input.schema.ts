// src/application/pilot/validation/variant-input.schema.ts

import * as S from "effect/Schema"
import {
  PriceSchema,
  CustomDimensionSchema,
  Size,
} from "../../../domain/pilot"

// ============================================
// VALIDATED STANDARD VARIANT (input, sans id)
// ============================================

const ValidatedStandardVariantSchema = S.Struct({
  size: S.Literal(Size.REGULAR, Size.LARGE),
}).pipe(S.attachPropertySignature("_tag", "StandardVariant"))

export type ValidatedStandardVariant = typeof ValidatedStandardVariantSchema.Type

// ============================================
// VALIDATED CUSTOM VARIANT (input, sans id)
// ============================================

const ValidatedCustomVariantSchema = S.Struct({
  size: S.Literal(Size.CUSTOM),
  customDimensions: CustomDimensionSchema,
  price: PriceSchema,
}).pipe(S.attachPropertySignature("_tag", "CustomVariant"))

export type ValidatedCustomVariant = typeof ValidatedCustomVariantSchema.Type

// ============================================
// VALIDATED VARIANT (union)
// ============================================

export const ValidatedVariantSchema = S.Union(
  ValidatedStandardVariantSchema,
  ValidatedCustomVariantSchema,
)

export type ValidatedVariant = typeof ValidatedVariantSchema.Type
