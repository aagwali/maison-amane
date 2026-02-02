// src/application/pilot/commands/update-pilot-product.command.ts

import { Data } from 'effect'
import * as S from 'effect/Schema'

import { CorrelationIdSchema, UserIdSchema } from '../../../domain/shared'
import { ProductIdSchema } from '../../../domain/pilot/value-objects'

// ============================================
// UNVALIDATED SCHEMAS (from UI/API boundary)
// ============================================

const UnvalidatedUpdateDataSchema = S.Struct({
  label: S.optional(S.String),
  type: S.optional(S.String),
  category: S.optional(S.String),
  description: S.optional(S.String),
  priceRange: S.optional(S.String),
  variants: S.optional(
    S.Array(
      S.Struct({
        size: S.String,
        customDimensions: S.optional(
          S.Struct({
            width: S.Number,
            length: S.Number,
          })
        ),
        price: S.optional(S.Number),
      })
    )
  ),
  views: S.optional(
    S.Array(
      S.Struct({
        viewType: S.String,
        imageUrl: S.String,
      })
    )
  ),
  status: S.optional(S.String),
})

export type UnvalidatedUpdateData = typeof UnvalidatedUpdateDataSchema.Type

// ============================================
// UPDATE PILOT PRODUCT COMMAND
// ============================================

const PilotProductUpdateCommandSchema = S.TaggedStruct('UpdatePilotProductCommand', {
  productId: ProductIdSchema,
  data: UnvalidatedUpdateDataSchema,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductUpdateCommand = typeof PilotProductUpdateCommandSchema.Type

export const MakePilotProductUpdateCommand = (
  params: Omit<PilotProductUpdateCommand, '_tag'>
): PilotProductUpdateCommand =>
  Data.case<PilotProductUpdateCommand>()({ _tag: 'UpdatePilotProductCommand', ...params })
