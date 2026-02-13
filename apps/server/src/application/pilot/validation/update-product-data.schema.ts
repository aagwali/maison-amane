// src/application/pilot/validation/update-product-data.schema.ts

import { Option } from 'effect'
import { type Effect, gen, succeed, map, mapError } from 'effect/Effect'
import type { Option as OptionType } from 'effect/Option'
import * as S from 'effect/Schema'

import {
  PriceRangeSchema,
  ProductCategorySchema,
  ProductDescriptionSchema,
  ProductLabelSchema,
  ProductStatusSchema,
  ProductTypeSchema,
  ProductViewsSchema,
  ValidationError,
} from '../../../domain/pilot'
import type { UnvalidatedUpdateData } from '../commands'

import { type ValidatedVariant, ValidatedVariantSchema } from './variant-input.schema'
import { ProductViewsTransformSchema } from './views.schema'

// Re-export for convenience
export type { ValidatedVariant }

// ============================================
// VALIDATED UPDATE DATA (all fields optional)
// ============================================

export interface ValidatedUpdateData {
  readonly label: OptionType<S.Schema.Type<typeof ProductLabelSchema>>
  readonly type: OptionType<S.Schema.Type<typeof ProductTypeSchema>>
  readonly category: OptionType<S.Schema.Type<typeof ProductCategorySchema>>
  readonly description: OptionType<S.Schema.Type<typeof ProductDescriptionSchema>>
  readonly priceRange: OptionType<S.Schema.Type<typeof PriceRangeSchema>>
  readonly variants: OptionType<readonly [ValidatedVariant, ...ValidatedVariant[]]>
  readonly views: OptionType<S.Schema.Type<typeof ProductViewsSchema>>
  readonly status: OptionType<S.Schema.Type<typeof ProductStatusSchema>>
}

// ============================================
// MAIN VALIDATOR
// ============================================

export const validateUpdateData = (
  data: UnvalidatedUpdateData
): Effect<ValidatedUpdateData, ValidationError> =>
  gen(function* () {
    const label = yield* validateOptionalField(data.label, ProductLabelSchema)
    const type = yield* validateOptionalField(data.type, ProductTypeSchema)
    const category = yield* validateOptionalField(data.category, ProductCategorySchema)
    const description = yield* validateOptionalField(data.description, ProductDescriptionSchema)
    const priceRange = yield* validateOptionalField(data.priceRange, PriceRangeSchema)
    const status = yield* validateOptionalField(data.status, ProductStatusSchema)
    const variants = yield* validateOptionalVariants(data.variants)
    const views = yield* validateOptionalViews(data.views)

    return {
      label,
      type,
      category,
      description,
      priceRange,
      variants,
      views,
      status,
    }
  })

// ============================================
// HELPERS
// ============================================

const validateOptionalField = <A, I, R>(
  value: unknown,
  schema: S.Schema<A, I, R>
): Effect<OptionType<A>, ValidationError, R> => {
  if (value === undefined) {
    return succeed(Option.none())
  }
  return S.decodeUnknown(schema)(value)
    .pipe(map(Option.some),
    mapError(ValidationError.fromParseError))
}

const validateOptionalVariants = (
  variants: UnvalidatedUpdateData['variants']
): Effect<OptionType<readonly [ValidatedVariant, ...ValidatedVariant[]]>, ValidationError> => {
  if (variants === undefined || variants.length === 0) {
    return succeed(Option.none())
  }
  return S.decodeUnknown(S.NonEmptyArray(ValidatedVariantSchema))(variants)
    .pipe(map(Option.some),
    mapError(ValidationError.fromParseError))
}

const validateOptionalViews = (
  views: UnvalidatedUpdateData['views']
): Effect<OptionType<S.Schema.Type<typeof ProductViewsSchema>>, ValidationError> => {
  if (views === undefined || views.length === 0) {
    return succeed(Option.none())
  }
  return S.decodeUnknown(ProductViewsTransformSchema)(views)
    .pipe(map(Option.some),
    mapError(ValidationError.fromParseError))
}
