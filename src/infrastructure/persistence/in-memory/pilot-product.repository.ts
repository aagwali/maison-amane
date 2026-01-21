// src/infrastructure/persistence/in-memory/pilot-product.repository.ts

import { Effect, Layer, Option } from "effect"
import type { PilotProduct } from "../../../domain/pilot"
import { PilotProductRepository } from "../../../ports/driven"

// ============================================
// IN-MEMORY PILOT PRODUCT REPOSITORY
// ============================================

export const makeInMemoryPilotProductRepository = (): PilotProductRepository => {
  const store = new Map<string, PilotProduct>()

  return {
    save: (product) =>
      Effect.sync(() => {
        store.set(product.id, product)
        return product
      }),

    findById: (id) =>
      Effect.sync(() => {
        const product = store.get(id)
        return product ? Option.some(product) : Option.none()
      }),

    update: (product) =>
      Effect.sync(() => {
        store.set(product.id, product)
        return product
      })
  }
}

export const InMemoryPilotProductRepositoryLive = Layer.succeed(
  PilotProductRepository,
  makeInMemoryPilotProductRepository()
)
