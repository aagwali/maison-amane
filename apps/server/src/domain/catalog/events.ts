// src/domain/catalog/events.ts

import * as S from 'effect/Schema'

import {
  type CorrelationId,
  CorrelationIdSchema,
  type UserId,
  UserIdSchema,
} from '../shared'
import { type ProductId, ProductIdSchema } from '../pilot'

// ============================================
// CATALOG PRODUCT PROJECTED
// ============================================

const CatalogProductProjectedSchema = S.TaggedStruct("CatalogProductProjected", {
  productId: ProductIdSchema,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type CatalogProductProjected = typeof CatalogProductProjectedSchema.Type

export const MakeCatalogProductProjected = (params: {
  productId: ProductId
  correlationId: CorrelationId
  userId: UserId
  timestamp: Date
}): CatalogProductProjected => ({
  _tag: "CatalogProductProjected",
  ...params,
})

// ============================================
// CATALOG DOMAIN EVENTS UNION
// ============================================

export type CatalogDomainEvent = CatalogProductProjected
