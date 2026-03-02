// src/application/pilot/mappers/variant.mapper.ts

import type { ProductVariant } from '../../../domain/pilot'
import type { ValidatedVariant } from '../validation'

// ============================================
// VARIANT MAPPING: Validated → Domain
// ValidatedVariant = ProductVariant (même type après refacto compositionnel)
// ============================================

export const createVariant = (v: ValidatedVariant): ProductVariant => v

export const createVariants = (
  validatedVariants: readonly [ValidatedVariant, ...ValidatedVariant[]]
): readonly [ProductVariant, ...ProductVariant[]] =>
  validatedVariants as readonly [ProductVariant, ...ProductVariant[]]
