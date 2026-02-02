// src/application/pilot/mappers/variant.mapper.ts

import {
  MakeCustomVariant,
  MakeStandardVariant,
  type ProductVariant,
  Size,
} from '../../../domain/pilot'
import type { ValidatedVariant } from '../validation'

// ============================================
// VARIANT MAPPING: Validated → Domain
// ============================================

/**
 * Maps a single validated variant to a domain ProductVariant
 */
export const createVariant = (v: ValidatedVariant): ProductVariant => {
  if (v._tag === 'CustomVariant') {
    return MakeCustomVariant({
      size: Size.CUSTOM,
      customDimensions: v.customDimensions,
      price: v.price,
    })
  }
  return MakeStandardVariant({
    size: v.size,
  })
}

/**
 * Maps a non-empty array of validated variants to domain ProductVariants
 * Preserves the non-empty array type constraint
 */
export const createVariants = (
  validatedVariants: readonly [ValidatedVariant, ...ValidatedVariant[]]
): readonly [ProductVariant, ...ProductVariant[]] => {
  const [first, ...rest] = validatedVariants
  return [createVariant(first), ...rest.map(createVariant)] as const
}
