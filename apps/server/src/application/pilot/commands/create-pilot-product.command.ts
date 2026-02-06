// src/application/pilot/commands/create-pilot-product.command.ts

import { Data } from 'effect'
import * as S from 'effect/Schema'
import {
  CreatePilotProductRequest,
  type CreatePilotProductRequest as CreatePilotProductRequestType,
} from '@maison-amane/api'

import { CorrelationIdSchema, UserIdSchema } from '../../../domain/shared'

// ============================================
// UNVALIDATED PRODUCT DATA (from API boundary)
// ============================================

export type UnvalidatedProductData = CreatePilotProductRequestType

// ============================================
// CREATE PILOT PRODUCT COMMAND
// ============================================

const PilotProductCreationCommandSchema = S.TaggedStruct('CreatePilotProductCommand', {
  data: CreatePilotProductRequest,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductCreationCommand = typeof PilotProductCreationCommandSchema.Type

export const makePilotProductCreationCommand = (
  params: Omit<PilotProductCreationCommand, '_tag'>
): PilotProductCreationCommand =>
  Data.case<PilotProductCreationCommand>()({ _tag: 'CreatePilotProductCommand', ...params })
