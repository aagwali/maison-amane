// src/domain/pilot/reference-data.ts

import { PriceRange, Size, type PredefinedSize, type ProductCategory } from './enums'
import type { ProductVariant } from './value-objects/variants'

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
      { width: 80, length: 200 },
    ],
    LARGE: [
      { width: 80, length: 250 },
      { width: 100, length: 300 },
    ],
  },
  STANDARD: {
    REGULAR: [
      { width: 120, length: 180 },
      { width: 140, length: 200 },
    ],
    LARGE: [
      { width: 160, length: 230 },
      { width: 200, length: 300 },
    ],
  },
}

export const getDimensionsForSize = (
  category: ProductCategory,
  size: PredefinedSize
): readonly Dimension[] => DIMENSION_SETS[category][size]

// ============================================
// PRICING (Reference Data)
// ============================================

/**
 * Base prices in centimes by price range and size.
 * Custom variants use their own price field instead.
 */
export const PRICE_BY_RANGE: Record<PriceRange, Record<Size, number>> = {
  [PriceRange.DISCOUNT]: {
    [Size.REGULAR]: 400_00,
    [Size.LARGE]: 600_00,
    [Size.CUSTOM]: 500_00, // Fallback, overridden by variant.price
  },
  [PriceRange.STANDARD]: {
    [Size.REGULAR]: 600_00,
    [Size.LARGE]: 900_00,
    [Size.CUSTOM]: 800_00,
  },
  [PriceRange.PREMIUM]: {
    [Size.REGULAR]: 900_00,
    [Size.LARGE]: 1400_00,
    [Size.CUSTOM]: 1200_00,
  },
}

/**
 * Gets the price for a variant based on its type and the product's price range.
 * - Custom variants: use the variant's own price
 * - Standard variants: lookup in PRICE_BY_RANGE
 */
export const getPriceForVariant = (variant: ProductVariant, priceRange: PriceRange): number => {
  if (variant._tag === 'CustomVariant') {
    return variant.price
  }
  return PRICE_BY_RANGE[priceRange][variant.size]
}
