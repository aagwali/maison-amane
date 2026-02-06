// src/domain/pilot/events.ts

import { Data } from 'effect'
import * as S from 'effect/Schema'

import { CorrelationIdSchema, UserIdSchema } from '../shared'

import { ProductIdSchema } from './value-objects'
import { PilotProductSchema } from './aggregate'

// ============================================
// PILOT PRODUCT PUBLISHED
// ============================================

const PilotProductPublishedSchema = S.TaggedStruct('PilotProductPublished', {
  productId: ProductIdSchema,
  product: PilotProductSchema,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductPublished = typeof PilotProductPublishedSchema.Type

export const makePilotProductPublished = (
  params: Omit<PilotProductPublished, '_tag'>
): PilotProductPublished =>
  Data.case<PilotProductPublished>()({ _tag: 'PilotProductPublished', ...params })

// ============================================
// PILOT PRODUCT UPDATED
// ============================================

const PilotProductUpdatedSchema = S.TaggedStruct('PilotProductUpdated', {
  productId: ProductIdSchema,
  product: PilotProductSchema,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductUpdated = typeof PilotProductUpdatedSchema.Type

export const makePilotProductUpdated = (
  params: Omit<PilotProductUpdated, '_tag'>
): PilotProductUpdated =>
  Data.case<PilotProductUpdated>()({ _tag: 'PilotProductUpdated', ...params })

// ============================================
// DOMAIN EVENTS UNION
// ============================================

export type PilotDomainEvent = PilotProductPublished | PilotProductUpdated
