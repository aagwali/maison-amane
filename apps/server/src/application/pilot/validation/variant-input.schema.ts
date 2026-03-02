// src/application/pilot/validation/variant-input.schema.ts

import { mapError } from 'effect/Effect'
import * as ParseResult from 'effect/ParseResult'
import * as S from 'effect/Schema'

import { type ProductVariant, ProductVariantSchema, Size } from '../../../domain/pilot'

// ============================================
// UNVALIDATED VARIANT (from UI/API boundary)
// ============================================

const UnvalidatedVariantSchema = S.Struct({
  size: S.optional(S.String), // 'MEDIUM' | 'LARGE' → CatalogSize
  width: S.optional(S.Number), // BespokeSize
  length: S.optional(S.Number), // BespokeSize
  negotiatedPrice: S.optional(S.Number), // NegotiatedPrice; absent = FormulaPrice
})

type UnvalidatedVariant = typeof UnvalidatedVariantSchema.Type

// ============================================
// TRANSFORMATION: Unvalidated → Validated
// ============================================

export const ValidatedVariantSchema: S.Schema<ProductVariant, UnvalidatedVariant> =
  S.transformOrFail(UnvalidatedVariantSchema, S.typeSchema(ProductVariantSchema), {
    strict: true,
    decode: (input) => {
      const rawSizeSpec =
        input.width !== undefined && input.length !== undefined
          ? { _tag: 'BespokeSize' as const, width: input.width, length: input.length }
          : { _tag: 'CatalogSize' as const, size: input.size ?? Size.MEDIUM }

      const rawPricingSpec =
        input.negotiatedPrice !== undefined
          ? { _tag: 'NegotiatedPrice' as const, amount: input.negotiatedPrice }
          : { _tag: 'FormulaPrice' as const }

      return S.decodeUnknown(ProductVariantSchema)({
        sizeSpec: rawSizeSpec,
        pricingSpec: rawPricingSpec,
      })
        .pipe(mapError((e) => e.issue))
    },
    encode: (validated) => {
      const sizeSpec = validated.sizeSpec
      const pricingSpec = validated.pricingSpec

      const sizePart =
        sizeSpec._tag === 'BespokeSize'
          ? { width: sizeSpec.width, length: sizeSpec.length }
          : { size: sizeSpec.size }

      const pricePart =
        pricingSpec._tag === 'NegotiatedPrice' ? { negotiatedPrice: pricingSpec.amount } : {}

      return ParseResult.succeed({ ...sizePart, ...pricePart })
    },
  })

export type ValidatedVariant = ProductVariant
