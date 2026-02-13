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
  _version: S.Literal(1),
  productId: ProductIdSchema,
  product: PilotProductSchema,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductPublished = typeof PilotProductPublishedSchema.Type

export const makePilotProductPublished = (
  params: Omit<PilotProductPublished, '_tag' | '_version'>
): PilotProductPublished =>
  Data.case<PilotProductPublished>()({ _tag: 'PilotProductPublished', _version: 1, ...params })

// ============================================
// PILOT PRODUCT UPDATED
// ============================================

const PilotProductUpdatedSchema = S.TaggedStruct('PilotProductUpdated', {
  _version: S.Literal(1),
  productId: ProductIdSchema,
  product: PilotProductSchema,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductUpdated = typeof PilotProductUpdatedSchema.Type

export const makePilotProductUpdated = (
  params: Omit<PilotProductUpdated, '_tag' | '_version'>
): PilotProductUpdated =>
  Data.case<PilotProductUpdated>()({ _tag: 'PilotProductUpdated', _version: 1, ...params })

// ============================================
// DOMAIN EVENTS UNION
// ============================================

export type PilotDomainEvent = PilotProductPublished | PilotProductUpdated
