// src/domain/catalog/events.ts

import { Data } from 'effect'
import * as S from 'effect/Schema'

import {
  CorrelationIdSchema,
  UserIdSchema,
} from '../shared'
import { ProductIdSchema } from '../pilot'

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

export const MakeCatalogProductProjected = (
  params: Omit<CatalogProductProjected, "_tag">
): CatalogProductProjected =>
   Data.case<CatalogProductProjected>()({ _tag: "CatalogProductProjected", ...params })

// ============================================
// CATALOG DOMAIN EVENTS UNION
// ============================================

export type CatalogDomainEvent = CatalogProductProjected
