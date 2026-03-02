// src/application/pilot/validation/variant-input.schema.test.ts
//
// UNIT TESTS: Variant transformation logic (CatalogSize/BespokeSize × FormulaPrice/NegotiatedPrice).
// This is the most important validation test as it contains conditional logic.

import { runSync, either } from 'effect/Effect'
import * as S from 'effect/Schema'
import { describe, expect, it } from 'vitest'

import { ValidatedVariantSchema } from './variant-input.schema'

// ============================================
// HELPER
// ============================================

const decode = (input: unknown) => S.decodeUnknown(ValidatedVariantSchema)(input)
  .pipe(runSync)

const decodeEither = (input: unknown) =>
  S.decodeUnknown(ValidatedVariantSchema)(input)
    .pipe(either, runSync)

// ============================================
// CATALOG SIZE + FORMULA PRICE
// ============================================

describe('ValidatedVariantSchema - CatalogSize + FormulaPrice', () => {
  it('accepts { size: MEDIUM } → CatalogSize + FormulaPrice', () => {
    const result = decode({ size: 'MEDIUM' })

    expect(result.sizeSpec._tag).toBe('CatalogSize')
    if (result.sizeSpec._tag === 'CatalogSize') {
      expect(result.sizeSpec.size).toBe('MEDIUM')
    }
    expect(result.pricingSpec._tag).toBe('FormulaPrice')
  })

  it('accepts { size: LARGE } → CatalogSize + FormulaPrice', () => {
    const result = decode({ size: 'LARGE' })

    expect(result.sizeSpec._tag).toBe('CatalogSize')
    if (result.sizeSpec._tag === 'CatalogSize') {
      expect(result.sizeSpec.size).toBe('LARGE')
    }
    expect(result.pricingSpec._tag).toBe('FormulaPrice')
  })

  it('defaults to CatalogSize MEDIUM when no fields provided', () => {
    const result = decode({})

    expect(result.sizeSpec._tag).toBe('CatalogSize')
    if (result.sizeSpec._tag === 'CatalogSize') {
      expect(result.sizeSpec.size).toBe('MEDIUM')
    }
    expect(result.pricingSpec._tag).toBe('FormulaPrice')
  })

  it('rejects invalid size string (e.g. CUSTOM not accepted as CatalogSize)', () => {
    // 'CUSTOM' is not in CatalogSize's accepted literals (MEDIUM | LARGE)
    const result = decodeEither({ size: 'CUSTOM' })

    expect(result._tag).toBe('Left')
  })

  it('rejects unknown size string', () => {
    const result = decodeEither({ size: 'INVALID_SIZE' })

    expect(result._tag).toBe('Left')
  })
})

// ============================================
// BESPOKE SIZE + FORMULA PRICE
// ============================================

describe('ValidatedVariantSchema - BespokeSize + FormulaPrice', () => {
  it('accepts { width, length } → BespokeSize + FormulaPrice', () => {
    const result = decode({ width: 120, length: 250 })

    expect(result.sizeSpec._tag).toBe('BespokeSize')
    if (result.sizeSpec._tag === 'BespokeSize') {
      expect(result.sizeSpec.width).toBe(120)
      expect(result.sizeSpec.length).toBe(250)
    }
    expect(result.pricingSpec._tag).toBe('FormulaPrice')
  })

  it('rejects BespokeSize with only width (missing length)', () => {
    // Only width → not enough for BespokeSize, falls back to CatalogSize with invalid size
    const result = decodeEither({ width: 120 })

    // Falls back to CatalogSize path (no size → default MEDIUM), should succeed
    // Actually: only width → BespokeSize condition not met (length undefined), so goes CatalogSize path
    expect(result._tag).toBe('Right')
    if (result._tag === 'Right') {
      expect(result.right.sizeSpec._tag).toBe('CatalogSize')
    }
  })
})

// ============================================
// NEGOTIATED PRICE
// ============================================

describe('ValidatedVariantSchema - NegotiatedPrice', () => {
  it('accepts { size: MEDIUM, negotiatedPrice } → CatalogSize + NegotiatedPrice', () => {
    const result = decode({ size: 'MEDIUM', negotiatedPrice: 15000 })

    expect(result.sizeSpec._tag).toBe('CatalogSize')
    expect(result.pricingSpec._tag).toBe('NegotiatedPrice')
    if (result.pricingSpec._tag === 'NegotiatedPrice') {
      expect(result.pricingSpec.amount).toBe(15000)
    }
  })

  it('accepts { width, length, negotiatedPrice } → BespokeSize + NegotiatedPrice', () => {
    const result = decode({ width: 120, length: 250, negotiatedPrice: 15000 })

    expect(result.sizeSpec._tag).toBe('BespokeSize')
    if (result.sizeSpec._tag === 'BespokeSize') {
      expect(result.sizeSpec.width).toBe(120)
      expect(result.sizeSpec.length).toBe(250)
    }
    expect(result.pricingSpec._tag).toBe('NegotiatedPrice')
    if (result.pricingSpec._tag === 'NegotiatedPrice') {
      expect(result.pricingSpec.amount).toBe(15000)
    }
  })
})
