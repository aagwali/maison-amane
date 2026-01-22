// src/domain/pilot/enums.ts

import { fromEnum } from "../shared"

// ============================================
// PRODUCT TYPE
// ============================================

export const ProductType = {
  TAPIS: "TAPIS",
  // Extensible: COUSSIN, PLAID...
} as const

export type ProductType = typeof ProductType[keyof typeof ProductType]

// ============================================
// PRODUCT CATEGORY
// ============================================

export const ProductCategory = {
  RUNNER: "RUNNER",
  STANDARD: "STANDARD",
} as const

export type ProductCategory = typeof ProductCategory[keyof typeof ProductCategory]

// ============================================
// SIZE
// ============================================

export const Size = {
  REGULAR: "REGULAR",
  LARGE: "LARGE",
  CUSTOM: "CUSTOM",
} as const

export type Size = typeof Size[keyof typeof Size]
export type PredefinedSize = Exclude<Size, "CUSTOM">

// ============================================
// PRICE RANGE
// ============================================

export const PriceRange = {
  DISCOUNT: "DISCOUNT",
  STANDARD: "STANDARD",
  PREMIUM: "PREMIUM",
} as const

export type PriceRange = typeof PriceRange[keyof typeof PriceRange]

// ============================================
// PRODUCT STATUS
// ============================================

export const ProductStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const

export type ProductStatus = typeof ProductStatus[keyof typeof ProductStatus]

// ============================================
// VIEW TYPE
// ============================================

export const ViewType = {
  FRONT: "FRONT",
  DETAIL: "DETAIL",
  BACK: "BACK",
  AMBIANCE: "AMBIANCE",
} as const

export type ViewType = typeof ViewType[keyof typeof ViewType]

export const REQUIRED_VIEW_TYPES: readonly ViewType[] = [
  ViewType.FRONT,
  ViewType.DETAIL,
]

// ============================================
// ENUM SCHEMAS
// ============================================

export const ProductTypeSchema = fromEnum(ProductType)
export const ProductCategorySchema = fromEnum(ProductCategory)
export const SizeSchema = fromEnum(Size)
export const PriceRangeSchema = fromEnum(PriceRange)
export const ProductStatusSchema = fromEnum(ProductStatus)
export const ViewTypeSchema = fromEnum(ViewType)
