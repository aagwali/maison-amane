// packages/shared-kernel/src/messaging/catalog-events.ts

import { Data } from 'effect'
import * as S from 'effect/Schema'

import { CorrelationIdSchema, ProductIdSchema, UserIdSchema } from '../domain/events'

// ============================================
// CATALOG PRODUCT PROJECTED
// Event publié quand un produit est projeté dans le read model Catalog
// Consommé par: (futur) analytics, monitoring
// ============================================

const CatalogProductProjectedSchema = S.TaggedStruct('CatalogProductProjected', {
  productId: ProductIdSchema,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type CatalogProductProjected = typeof CatalogProductProjectedSchema.Type

export const MakeCatalogProductProjected = (
  params: Omit<CatalogProductProjected, '_tag'>
): CatalogProductProjected =>
  Data.case<CatalogProductProjected>()({ _tag: 'CatalogProductProjected', ...params })

export { CatalogProductProjectedSchema }

// ============================================
// CATALOG DOMAIN EVENTS UNION
// ============================================

export type CatalogDomainEvent = CatalogProductProjected
