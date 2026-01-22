// src/application/pilot/validation/variant-input.schema.ts

import * as S from "effect/Schema"
import * as ParseResult from "effect/ParseResult"
import { Effect } from "effect"
import {
  Size,
  CustomDimensionSchema,
  PriceSchema,
  VariantBaseSchema,
  type VariantBase,
} from "../../../domain/pilot"

// ============================================
// UNVALIDATED VARIANT (from UI/API boundary)
// ============================================

const UnvalidatedVariantSchema = S.Struct({
  size: S.String,
  customDimensions: S.optional(
    S.Struct({
      width: S.Number,
      length: S.Number,
    }),
  ),
  price: S.optional(S.Number),
})

type UnvalidatedVariant = typeof UnvalidatedVariantSchema.Type

// ============================================
// VALIDATED VARIANT SCHEMAS (for decode targets)
// ============================================

const CustomVariantTargetSchema = S.Struct({
  _tag: S.Literal("CustomVariant"),
  size: S.Literal(Size.CUSTOM),
  customDimensions: CustomDimensionSchema,
  price: PriceSchema,
})

const StandardVariantTargetSchema = S.Struct({
  _tag: S.Literal("StandardVariant"),
  size: S.Literal(Size.REGULAR, Size.LARGE),
})

// ============================================
// TRANSFORMATION: Unvalidated → Validated
// ============================================

export const ValidatedVariantSchema: S.Schema<VariantBase, UnvalidatedVariant> =
  S.transformOrFail(UnvalidatedVariantSchema, S.typeSchema(VariantBaseSchema), {
    strict: true,
    decode: (input) => {
      if (input.size === Size.CUSTOM) {
        return S.decodeUnknown(CustomVariantTargetSchema)({
          _tag: "CustomVariant",
          size: input.size,
          customDimensions: input.customDimensions,
          price: input.price,
        }).pipe(
          Effect.mapError((e) => e.issue)
        )
      }

      return S.decodeUnknown(StandardVariantTargetSchema)({
        _tag: "StandardVariant",
        size: input.size,
      }).pipe(
        Effect.mapError((e) => e.issue)
      )
    },
    encode: (validated) => {
      if (validated._tag === "CustomVariant") {
        return ParseResult.succeed({
          size: validated.size,
          customDimensions: validated.customDimensions,
          price: validated.price,
        })
      }
      return ParseResult.succeed({
        size: validated.size,
      })
    },
  })

export type ValidatedVariant = VariantBase
