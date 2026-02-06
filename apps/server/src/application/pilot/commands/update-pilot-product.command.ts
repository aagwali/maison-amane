// src/application/pilot/commands/update-pilot-product.command.ts

import { Data } from 'effect'
import * as S from 'effect/Schema'
import {
  UpdatePilotProductRequest,
  type UpdatePilotProductRequest as UpdatePilotProductRequestType,
} from '@maison-amane/api'

import { CorrelationIdSchema, UserIdSchema } from '../../../domain/shared'
import { ProductIdSchema } from '../../../domain/pilot/value-objects'

// ============================================
// UNVALIDATED UPDATE DATA (from API boundary)
// ============================================

export type UnvalidatedUpdateData = UpdatePilotProductRequestType

// ============================================
// UPDATE PILOT PRODUCT COMMAND
// ============================================

const PilotProductUpdateCommandSchema = S.TaggedStruct('UpdatePilotProductCommand', {
  productId: ProductIdSchema,
  data: UpdatePilotProductRequest,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductUpdateCommand = typeof PilotProductUpdateCommandSchema.Type

export const makePilotProductUpdateCommand = (
  params: Omit<PilotProductUpdateCommand, '_tag'>
): PilotProductUpdateCommand =>
  Data.case<PilotProductUpdateCommand>()({ _tag: 'UpdatePilotProductCommand', ...params })
