// src/application/pilot/commands/create-pilot-product.command.ts

import * as S from "effect/Schema"
import { case as constructor } from "effect/Data"
import {
  CorrelationIdSchema,
  UserIdSchema,
  TaggedSchema,
} from "../../../domain/shared"

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

const PilotProductCreationCommandSchema = TaggedSchema(
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

export const MakeCreatePilotProductCommand =
  constructor<PilotProductCreationCommand>()
