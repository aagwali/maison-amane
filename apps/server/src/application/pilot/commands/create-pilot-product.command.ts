// src/application/pilot/commands/create-pilot-product.command.ts

import { case as constructor } from 'effect/Data'
import * as S from 'effect/Schema'

import { CorrelationIdSchema, UserIdSchema } from '../../../domain/shared'

// ============================================
// UNVALIDATED SCHEMAS (from UI/API boundary)
// ============================================

const UnvalidatedProductDataSchema = S.Struct({
  label: S.String,
  type: S.String,
  category: S.String,
  description: S.String,
  priceRange: S.String,
  variants: S.Array(S.Struct({
    size: S.String,
    customDimensions: S.optional(
      S.Struct({
        width: S.Number,
        length: S.Number,
      }),
    ),
    price: S.optional(S.Number),
  })),
  views: S.Array(S.Struct({
    viewType: S.String,
    imageUrl: S.String,
  })),
  status: S.String,
})

export type UnvalidatedProductData = typeof UnvalidatedProductDataSchema.Type

// ============================================
// CREATE PILOT PRODUCT COMMAND
// ============================================

const PilotProductCreationCommandSchema = S.TaggedStruct(
  "CreatePilotProductCommand",
  {
    data: UnvalidatedProductDataSchema,
    correlationId: CorrelationIdSchema,
    userId: UserIdSchema,
    timestamp: S.Date,
  },
)

export type PilotProductCreationCommand =
  typeof PilotProductCreationCommandSchema.Type

export const MakePilotProductCreationCommand =
  constructor<PilotProductCreationCommand>()
