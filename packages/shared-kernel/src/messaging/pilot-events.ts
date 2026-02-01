// packages/shared-kernel/src/messaging/pilot-events.ts

import { Data } from 'effect'
import * as S from 'effect/Schema'

import { CorrelationIdSchema, ProductIdSchema, UserIdSchema } from '../domain/events'

// ============================================
// PILOT PRODUCT PUBLISHED
// Event publié quand un produit Pilot est créé/mis à jour
// Consommé par: catalog-projection, shopify-sync
// ============================================

// Note: Le produit complet est inclus pour éviter un appel supplémentaire
// Les consumers peuvent ainsi construire leur propre vue directement
const PilotProductPublishedSchema = S.TaggedStruct('PilotProductPublished', {
  productId: ProductIdSchema,
  product: S.Any, // PilotProduct aggregate (type complexe du domain Pilot)
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductPublished = typeof PilotProductPublishedSchema.Type

export const MakePilotProductPublished = (
  params: Omit<PilotProductPublished, '_tag'>
): PilotProductPublished =>
  Data.case<PilotProductPublished>()({ _tag: 'PilotProductPublished', ...params })

export { PilotProductPublishedSchema }

// ============================================
// PILOT PRODUCT SYNCED
// Event publié quand un produit est synchronisé avec Shopify
// Consommé par: (futur) analytics, audit log
// ============================================

const PilotProductSyncedSchema = S.TaggedStruct('PilotProductSynced', {
  productId: ProductIdSchema,
  shopifyProductId: S.String,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductSynced = typeof PilotProductSyncedSchema.Type

export const MakePilotProductSynced = (
  params: Omit<PilotProductSynced, '_tag'>
): PilotProductSynced => Data.case<PilotProductSynced>()({ _tag: 'PilotProductSynced', ...params })

export { PilotProductSyncedSchema }

// ============================================
// PILOT DOMAIN EVENTS UNION
// ============================================

export type PilotDomainEvent = PilotProductPublished | PilotProductSynced
