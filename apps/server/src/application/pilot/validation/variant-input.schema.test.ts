// src/application/pilot/validation/variant-input.schema.test.ts
//
// UNIT TESTS: Variant transformation logic (CUSTOM vs STANDARD).
// This is the most important validation test as it contains conditional logic.

import { runSync, either } from 'effect/Effect'
import * as S from 'effect/Schema'
import { describe, expect, it } from 'vitest'

import { Size } from '../../../domain/pilot'

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
// STANDARD VARIANTS (REGULAR, LARGE)
// ============================================

describe('ValidatedVariantSchema - StandardVariant', () => {
  it('accepts REGULAR size without dimensions', () => {
    const result = decode({ size: Size.REGULAR })

    expect(result._tag).toBe('StandardVariant')
    expect(result.size).toBe(Size.REGULAR)
  })

  it('accepts LARGE size without dimensions', () => {
    const result = decode({ size: Size.LARGE })

    expect(result._tag).toBe('StandardVariant')
    expect(result.size).toBe(Size.LARGE)
  })

  it('ignores customDimensions if provided for REGULAR', () => {
    // Extra fields are ignored for standard variants
    const result = decode({
      size: Size.REGULAR,
      customDimensions: { width: 100, length: 200 },
      price: 5000,
    })

    expect(result._tag).toBe('StandardVariant')
    // StandardVariant does not have customDimensions field
    expect('customDimensions' in result).toBe(false)
  })

  it('rejects invalid size string', () => {
    const result = decodeEither({ size: 'INVALID_SIZE' })

    expect(result._tag).toBe('Left')
  })
})

// ============================================
// CUSTOM VARIANTS
// ============================================

describe('ValidatedVariantSchema - CustomVariant', () => {
  it('accepts CUSTOM with valid dimensions and price', () => {
    const result = decode({
      size: Size.CUSTOM,
      customDimensions: { width: 120, length: 250 },
      price: 15000,
    })

    expect(result._tag).toBe('CustomVariant')
    expect(result.size).toBe(Size.CUSTOM)
    if (result._tag === 'CustomVariant') {
      expect(result.customDimensions.width).toBe(120)
      expect(result.customDimensions.length).toBe(250)
      expect(result.price).toBe(15000)
    }
  })

  it('rejects CUSTOM without customDimensions', () => {
    const result = decodeEither({
      size: Size.CUSTOM,
      price: 15000,
    })

    expect(result._tag).toBe('Left')
  })

  it('rejects CUSTOM without price', () => {
    const result = decodeEither({
      size: Size.CUSTOM,
      customDimensions: { width: 120, length: 250 },
    })

    expect(result._tag).toBe('Left')
  })
})
