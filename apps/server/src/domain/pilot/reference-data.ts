// src/domain/pilot/reference-data.ts

import { type Material, type PredefinedSize, type ProductShapeType } from './enums'
import type { VariantSize } from './value-objects/variants'

// ============================================
// DIMENSION
// ============================================

export interface Dimension {
  readonly width: number
  readonly length: number
}

// ============================================
// DIMENSION SETS (Reference Data)
// Un seul scalaire par (shape, size) — pas de tableau
// ============================================

export const DIMENSION_SETS: Record<
  ProductShapeType,
  Partial<Record<PredefinedSize, Dimension>>
> = {
  RUNNER: {
    MEDIUM: { width: 80, length: 300 },
    LARGE: { width: 100, length: 300 },
  },
  STANDARD: {
    EXTRA_SMALL: { width: 80, length: 120 },
    SMALL: { width: 140, length: 200 },
    MEDIUM: { width: 170, length: 240 },
    LARGE: { width: 200, length: 300 },
    EXTRA_LARGE: { width: 300, length: 300 },
  },
}

// ============================================
// PRICING (Reference Data)
// Prix en centimes par m² selon le matériau
// ============================================

export const PRICE_PER_SQM: Record<Material, number> = {
  MTIRT: 80_00,
  BENI_OUARAIN: 150_00,
  AZILAL: 200_00,
}

/**
 * Calcule le prix formulaire d'un variant à partir de ses dimensions et du matériau.
 * Prix = Math.round((width * length / 10_000) * PRICE_PER_SQM[material])
 * Arrondi au centime.
 */
export const calculateVariantPrice = (
  sizeSpec: VariantSize,
  shape: ProductShapeType,
  material: Material
): number => {
  const pricePerSqm = PRICE_PER_SQM[material]

  if (sizeSpec._tag === 'CatalogSize') {
    const dim = DIMENSION_SETS[shape][sizeSpec.size]
    if (!dim) throw new Error(`No dimension for shape=${shape} size=${sizeSpec.size}`)
    return Math.round(((dim.width * dim.length) / 10_000) * pricePerSqm)
  }

  // BespokeSize — dimensions custom
  return Math.round(((sizeSpec.width * sizeSpec.length) / 10_000) * pricePerSqm)
}
