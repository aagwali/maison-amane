// src/domain/pilot/events.ts

import * as S from "effect/Schema"
import { case as constructor } from "effect/Data"
import { CorrelationIdSchema, UserIdSchema, TaggedSchema } from "../shared"
import { ProductIdSchema } from "./value-objects"
import type { PilotProduct } from "./aggregate"

// ============================================
// PILOT PRODUCT PUBLISHED
// ============================================

// Note: PilotProduct is a complex type, we use S.Any for schema
const PilotProductSchema = S.Any as S.Schema<PilotProduct>

const PilotProductPublishedSchema = TaggedSchema("PilotProductPublished", {
  productId: ProductIdSchema,
  product: PilotProductSchema,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductPublished = typeof PilotProductPublishedSchema.Type

export const MakePilotProductPublished = constructor<PilotProductPublished>()

// ============================================
// DOMAIN EVENTS UNION
// ============================================

export type PilotDomainEvent = PilotProductPublished
