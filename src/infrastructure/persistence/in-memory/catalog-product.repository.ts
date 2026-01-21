// src/infrastructure/persistence/in-memory/catalog-product.repository.ts

import { Effect, Layer, Option } from "effect"
import type { CatalogProduct } from "../../../domain/catalog"
import type { ProductId } from "../../../domain/pilot"
import { CatalogProductRepository } from "../../../ports/driven"

// ============================================
// IN-MEMORY CATALOG PRODUCT REPOSITORY
// ============================================

export const makeInMemoryCatalogProductRepository = (): CatalogProductRepository => {
  const store = new Map<string, CatalogProduct>()

  return {
    upsert: (product) =>
      Effect.sync(() => {
        store.set(product.id, product)
        return product
      }),

    findById: (id: ProductId) =>
      Effect.sync(() => {
        const product = store.get(id)
        return product ? Option.some(product) : Option.none()
      }),

    findAll: () =>
      Effect.sync(() => Array.from(store.values()))
  }
}

export const InMemoryCatalogProductRepositoryLive = Layer.succeed(
  CatalogProductRepository,
  makeInMemoryCatalogProductRepository()
)
