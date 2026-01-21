// src/domain/pilot/enums.ts

import * as S from "effect/Schema"

// ============================================
// SCHEMA HELPER
// ============================================

const fromEnum = <T extends Record<string, string>>(e: T) =>
  S.Literal(...Object.values(e) as [T[keyof T], ...T[keyof T][]])

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
  STANDARD: "STANDARD",
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

export const MIN_VIEWS = 4

// ============================================
// DIMENSION SETS (Reference Data)
// ============================================

export interface Dimension {
  readonly width: number
  readonly length: number
}

export const DIMENSION_SETS: Record<
  ProductCategory,
  Record<PredefinedSize, readonly Dimension[]>
> = {
  RUNNER: {
    STANDARD: [
      { width: 60, length: 180 },
      { width: 80, length: 200 }
    ],
    LARGE: [
      { width: 80, length: 250 },
      { width: 100, length: 300 }
    ]
  },
  STANDARD: {
    STANDARD: [
      { width: 120, length: 180 },
      { width: 140, length: 200 }
    ],
    LARGE: [
      { width: 160, length: 230 },
      { width: 200, length: 300 }
    ]
  }
}

export const getDimensionsForSize = (
  category: ProductCategory,
  size: PredefinedSize
): readonly Dimension[] => DIMENSION_SETS[category][size]

// ============================================
// ENUM SCHEMAS
// ============================================

export const ProductTypeSchema = fromEnum(ProductType)
export const ProductCategorySchema = fromEnum(ProductCategory)
export const SizeSchema = fromEnum(Size)
export const PriceRangeSchema = fromEnum(PriceRange)
export const ProductStatusSchema = fromEnum(ProductStatus)
export const ViewTypeSchema = fromEnum(ViewType)
