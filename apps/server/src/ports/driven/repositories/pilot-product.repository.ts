// src/ports/driven/repositories/pilot-product.repository.ts

import { Context, Effect, Option } from "effect"
import type { ProductId, PilotProduct } from "../../../domain/pilot"
import type { PersistenceError } from "../errors"

// ============================================
// PILOT PRODUCT REPOSITORY (Write Model)
// ============================================

export interface PilotProductRepository {
  readonly save: (
    product: PilotProduct
  ) => Effect.Effect<PilotProduct, PersistenceError>

  readonly findById: (
    id: ProductId
  ) => Effect.Effect<Option.Option<PilotProduct>, PersistenceError>

  readonly update: (
    product: PilotProduct
  ) => Effect.Effect<PilotProduct, PersistenceError>
}

export const PilotProductRepository = Context.GenericTag<PilotProductRepository>(
  "PilotProductRepository"
)
