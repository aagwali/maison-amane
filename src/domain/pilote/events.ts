// src/domain/pilote/events.ts

import type { ProductId, CorrelationId, UserId } from "./value-objects"
import type { PilotProduct } from "./aggregate"

// ============================================
// PILOT PRODUCT CREATED
// ============================================

export interface PilotProductCreated {
  readonly _tag: "PilotProductCreated"
  readonly productId: ProductId
  readonly product: PilotProduct
  readonly correlationId: CorrelationId
  readonly userId: UserId
  readonly timestamp: Date
}

export const PilotProductCreated = {
  create: (
    product: PilotProduct,
    correlationId: CorrelationId,
    userId: UserId,
    timestamp: Date
  ): PilotProductCreated => ({
    _tag: "PilotProductCreated",
    productId: product.id,
    product,
    correlationId,
    userId,
    timestamp
  })
}
