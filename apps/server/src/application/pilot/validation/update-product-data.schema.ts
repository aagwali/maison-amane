// src/application/pilot/validation/update-product-data.schema.ts

import { Effect, Option } from 'effect'
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
  readonly label: Option.Option<S.Schema.Type<typeof ProductLabelSchema>>
  readonly type: Option.Option<S.Schema.Type<typeof ProductTypeSchema>>
  readonly category: Option.Option<S.Schema.Type<typeof ProductCategorySchema>>
  readonly description: Option.Option<S.Schema.Type<typeof ProductDescriptionSchema>>
  readonly priceRange: Option.Option<S.Schema.Type<typeof PriceRangeSchema>>
  readonly variants: Option.Option<readonly [ValidatedVariant, ...ValidatedVariant[]]>
  readonly views: Option.Option<S.Schema.Type<typeof ProductViewsSchema>>
  readonly status: Option.Option<S.Schema.Type<typeof ProductStatusSchema>>
}

// ============================================
// MAIN VALIDATOR
// ============================================

export const validateUpdateData = (
  data: UnvalidatedUpdateData
): Effect.Effect<ValidatedUpdateData, ValidationError> =>
  Effect.gen(function* () {
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
): Effect.Effect<Option.Option<A>, ValidationError, R> => {
  if (value === undefined) {
    return Effect.succeed(Option.none())
  }
  return S.decodeUnknown(schema)(value).pipe(
    Effect.map(Option.some),
    Effect.mapError(ValidationError.fromParseError)
  )
}

const validateOptionalVariants = (
  variants: UnvalidatedUpdateData['variants']
): Effect.Effect<
  Option.Option<readonly [ValidatedVariant, ...ValidatedVariant[]]>,
  ValidationError
> => {
  if (variants === undefined || variants.length === 0) {
    return Effect.succeed(Option.none())
  }
  return S.decodeUnknown(S.NonEmptyArray(ValidatedVariantSchema))(variants).pipe(
    Effect.map(Option.some),
    Effect.mapError(ValidationError.fromParseError)
  )
}

const validateOptionalViews = (
  views: UnvalidatedUpdateData['views']
): Effect.Effect<Option.Option<S.Schema.Type<typeof ProductViewsSchema>>, ValidationError> => {
  if (views === undefined || views.length === 0) {
    return Effect.succeed(Option.none())
  }
  return S.decodeUnknown(ProductViewsTransformSchema)(views).pipe(
    Effect.map(Option.some),
    Effect.mapError(ValidationError.fromParseError)
  )
}
