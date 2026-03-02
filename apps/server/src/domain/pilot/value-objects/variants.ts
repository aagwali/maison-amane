// src/domain/pilot/value-objects/variants.ts

import * as S from 'effect/Schema'

import { Size } from '../enums'

import { PositiveCmSchema, PriceSchema } from './scalar-types'

// ============================================
// AXE 1 : DIMENSIONS
// ============================================

export const CatalogSizeSchema = S.Struct({
  _tag: S.Literal('CatalogSize'),
  size: S.Literal(Size.EXTRA_SMALL, Size.SMALL, Size.MEDIUM, Size.LARGE, Size.EXTRA_LARGE),
})

export type CatalogSize = typeof CatalogSizeSchema.Type

export const BespokeSizeSchema = S.Struct({
  _tag: S.Literal('BespokeSize'),
  width: PositiveCmSchema,
  length: PositiveCmSchema,
})

export type BespokeSize = typeof BespokeSizeSchema.Type

export const VariantSizeSchema = S.Union(CatalogSizeSchema, BespokeSizeSchema)

export type VariantSize = typeof VariantSizeSchema.Type

// ============================================
// AXE 2 : PRIX
// ============================================

export const FormulaPricingSchema = S.Struct({
  _tag: S.Literal('FormulaPrice'),
})

export type FormulaPricing = typeof FormulaPricingSchema.Type

export const NegotiatedPricingSchema = S.Struct({
  _tag: S.Literal('NegotiatedPrice'),
  amount: PriceSchema,
})

export type NegotiatedPricing = typeof NegotiatedPricingSchema.Type

export const VariantPricingSchema = S.Union(FormulaPricingSchema, NegotiatedPricingSchema)

export type VariantPricing = typeof VariantPricingSchema.Type

// ============================================
// VARIANT = COMPOSITION
// ============================================

export const ProductVariantSchema = S.Struct({
  sizeSpec: VariantSizeSchema,
  pricingSpec: VariantPricingSchema,
})

export type ProductVariant = typeof ProductVariantSchema.Type
