// src/domain/pilot/enums.ts

import { fromEnum } from '../shared'

// ============================================
// PRODUCT TYPE
// ============================================

export const ProductType = {
  TAPIS: 'TAPIS',
  // Extensible: COUSSIN, PLAID...
} as const

export type ProductType = (typeof ProductType)[keyof typeof ProductType]

// ============================================
// PRODUCT SHAPE (shared - cross-context)
// ============================================

export { ProductShape, ProductShapeSchema } from '@maison-amane/shared-kernel'
export type { ProductShape as ProductShapeType } from '@maison-amane/shared-kernel'

// ============================================
// MATERIAL (shared - cross-context)
// ============================================

export { Material, MaterialSchema } from '@maison-amane/shared-kernel'
export type { Material as MaterialType } from '@maison-amane/shared-kernel'

// ============================================
// SIZE (shared - cross-context)
// ============================================

export { Size, SizeSchema } from '@maison-amane/shared-kernel'
export type PredefinedSize = 'EXTRA_SMALL' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE'

// ============================================
// PRODUCT STATUS
// ============================================

export const ProductStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const

export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus]

// ============================================
// VIEW TYPE
// ============================================

export const ViewType = {
  FRONT: 'FRONT',
  DETAIL: 'DETAIL',
  BACK: 'BACK',
  AMBIANCE: 'AMBIANCE',
} as const

export type ViewType = (typeof ViewType)[keyof typeof ViewType]

export const REQUIRED_VIEW_TYPES: readonly ViewType[] = [ViewType.FRONT, ViewType.DETAIL]

// ============================================
// ENUM SCHEMAS
// ============================================

export const ProductTypeSchema = fromEnum(ProductType)
export const ProductStatusSchema = fromEnum(ProductStatus)
export const ViewTypeSchema = fromEnum(ViewType)
