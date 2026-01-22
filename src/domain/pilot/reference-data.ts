// src/domain/pilot/reference-data.ts

import type { ProductCategory, PredefinedSize } from "./enums"

// ============================================
// DIMENSION
// ============================================

export interface Dimension {
  readonly width: number
  readonly length: number
}

// ============================================
// DIMENSION SETS (Reference Data)
// ============================================

export const DIMENSION_SETS: Record<
  ProductCategory,
  Record<PredefinedSize, readonly Dimension[]>
> = {
  RUNNER: {
    REGULAR: [
      { width: 60, length: 180 },
      { width: 80, length: 200 }
    ],
    LARGE: [
      { width: 80, length: 250 },
      { width: 100, length: 300 }
    ]
  },
  STANDARD: {
    REGULAR: [
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
