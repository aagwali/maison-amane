// src/domain/pilot/events.ts

import * as S from 'effect/Schema'

import {
  type CorrelationId,
  CorrelationIdSchema,
  type UserId,
  UserIdSchema,
} from '../shared'
import { type ProductId, ProductIdSchema } from './value-objects'

import type { PilotProduct } from "./aggregate"

// ============================================
// PILOT PRODUCT PUBLISHED
// ============================================

// Note: PilotProduct is a complex type, we use S.Any for schema
const PilotProductSchema = S.Any as S.Schema<PilotProduct>

const PilotProductPublishedSchema = S.TaggedStruct("PilotProductPublished", {
  productId: ProductIdSchema,
  product: PilotProductSchema,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductPublished = typeof PilotProductPublishedSchema.Type

export const MakePilotProductPublished = (params: {
  productId: ProductId
  product: PilotProduct
  correlationId: CorrelationId
  userId: UserId
  timestamp: Date
}): PilotProductPublished => ({
  _tag: "PilotProductPublished",
  ...params,
})

// ============================================
// DOMAIN EVENTS UNION
// ============================================

export type PilotDomainEvent = PilotProductPublished
