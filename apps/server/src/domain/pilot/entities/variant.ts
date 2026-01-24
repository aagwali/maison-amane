// src/domain/pilot/entities/variant.ts
//
// ============================================
// DDD: VALUE OBJECTS
// ============================================
//
// Variants are Value Objects, not Entities:
// - Defined by their attributes (size, dimensions, price)
// - No identity of their own - they exist only within a Product aggregate
// - Immutable - changes create new variants, not mutations
// - Two variants with the same attributes are semantically equal
//
// Re-exports from value-objects for backward compatibility with existing imports.

import {
  CustomVariantBaseSchema,
  StandardVariantBaseSchema,
  VariantBaseSchema,
  type CustomVariantBase,
  type StandardVariantBase,
  type VariantBase,
} from '../value-objects/variants'

// ============================================
// STANDARD VARIANT (value object)
// ============================================

export const StandardVariantSchema = StandardVariantBaseSchema

export type StandardVariant = StandardVariantBase

// ============================================
// CUSTOM VARIANT (value object)
// ============================================

export const CustomVariantSchema = CustomVariantBaseSchema

export type CustomVariant = CustomVariantBase

// ============================================
// PRODUCT VARIANT (union)
// ============================================

export const ProductVariantSchema = VariantBaseSchema

export type ProductVariant = VariantBase
