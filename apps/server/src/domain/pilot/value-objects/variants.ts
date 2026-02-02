// src/domain/pilot/value-objects/variants.ts

import * as S from 'effect/Schema'

import { Size } from '../enums'

import { CustomDimensionSchema } from './dimensions'
import { PriceSchema } from './scalar-types'

// ============================================
// STANDARD VARIANT BASE (value object, without id)
// ============================================

export const StandardVariantBaseSchema = S.Struct({
  _tag: S.Literal('StandardVariant'),
  size: S.Literal(Size.REGULAR, Size.LARGE),
})

export type StandardVariantBase = typeof StandardVariantBaseSchema.Type

// ============================================
// CUSTOM VARIANT BASE (value object, without id)
// ============================================

export const CustomVariantBaseSchema = S.Struct({
  _tag: S.Literal('CustomVariant'),
  size: S.Literal(Size.CUSTOM),
  customDimensions: CustomDimensionSchema,
  price: PriceSchema,
})

export type CustomVariantBase = typeof CustomVariantBaseSchema.Type

// ============================================
// VARIANT BASE (union)
// ============================================

export const VariantBaseSchema = S.Union(StandardVariantBaseSchema, CustomVariantBaseSchema)

export type VariantBase = typeof VariantBaseSchema.Type

// ============================================
// ALIASES (for aggregate usage)
// ============================================

export const ProductVariantSchema = VariantBaseSchema
export type ProductVariant = VariantBase

export const StandardVariantSchema = StandardVariantBaseSchema
export type StandardVariant = StandardVariantBase

export const CustomVariantSchema = CustomVariantBaseSchema
export type CustomVariant = CustomVariantBase
