// src/domain/pilot/events.ts

import type { CorrelationId, UserId } from "../shared"
import type { ProductId } from "./value-objects"
import type { PilotProduct } from "./aggregate"

// ============================================
// PILOT PRODUCT PUBLISHED
// Emitted when a product is published, triggers:
// - Shopify sync
// - CatalogProduct projection
// ============================================

export interface PilotProductPublished {
  readonly _tag: "PilotProductPublished"
  readonly productId: ProductId
  readonly product: PilotProduct
  readonly correlationId: CorrelationId
  readonly userId: UserId
  readonly timestamp: Date
}

export const PilotProductPublished = {
  create: (
    product: PilotProduct,
    correlationId: CorrelationId,
    userId: UserId,
    timestamp: Date
  ): PilotProductPublished => ({
    _tag: "PilotProductPublished",
    productId: product.id,
    product,
    correlationId,
    userId,
    timestamp
  })
}

// ============================================
// DOMAIN EVENTS UNION
// ============================================

export type PilotDomainEvent = PilotProductPublished
