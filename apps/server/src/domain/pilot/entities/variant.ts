// src/domain/pilot/entities/variant.ts

import * as S from 'effect/Schema'

import { VariantIdSchema } from '../value-objects/ids'
import {
  CustomVariantBaseSchema,
  StandardVariantBaseSchema,
} from '../value-objects/variants'

// ============================================
// STANDARD VARIANT (entity with id)
// ============================================

export const StandardVariantSchema = S.extend(
  StandardVariantBaseSchema,
  S.Struct({ id: VariantIdSchema })
)

export type StandardVariant = typeof StandardVariantSchema.Type

// ============================================
// CUSTOM VARIANT (entity with id)
// ============================================

export const CustomVariantSchema = S.extend(
  CustomVariantBaseSchema,
  S.Struct({ id: VariantIdSchema })
)

export type CustomVariant = typeof CustomVariantSchema.Type

// ============================================
// PRODUCT VARIANT (union)
// ============================================

export const ProductVariantSchema = S.Union(StandardVariantSchema, CustomVariantSchema)

export type ProductVariant = typeof ProductVariantSchema.Type
