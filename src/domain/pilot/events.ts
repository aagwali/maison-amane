// src/domain/pilot/events.ts

import * as S from "effect/Schema"
import { CorrelationIdSchema, UserIdSchema, type CorrelationId, type UserId } from "../shared"
import { ProductIdSchema, type ProductId } from "./value-objects"
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
