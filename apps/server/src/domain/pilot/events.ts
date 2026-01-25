// src/domain/pilot/events.ts

import { Data } from 'effect'
import * as S from 'effect/Schema'

import {
  CorrelationIdSchema,
  UserIdSchema,
} from '../shared'
import { ProductIdSchema } from './value-objects'

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

export const MakePilotProductPublished = (
  params: Omit<PilotProductPublished, "_tag">
): PilotProductPublished => Data.case<PilotProductPublished>()({ _tag: "PilotProductPublished", ...params })

// ============================================
// PILOT PRODUCT SYNCED
// ============================================

const PilotProductSyncedSchema = S.TaggedStruct("PilotProductSynced", {
  productId: ProductIdSchema,
  shopifyProductId: S.String,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductSynced = typeof PilotProductSyncedSchema.Type

export const MakePilotProductSynced = (
  params: Omit<PilotProductSynced, "_tag">
): PilotProductSynced => Data.case<PilotProductSynced>()({ _tag: "PilotProductSynced", ...params })

// ============================================
// DOMAIN EVENTS UNION
// ============================================

export type PilotDomainEvent = PilotProductPublished | PilotProductSynced
