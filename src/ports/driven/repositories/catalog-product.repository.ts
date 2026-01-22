// src/ports/driven/repositories/catalog-product.repository.ts

import { Context, Effect, Option } from "effect"
import type { CatalogProduct } from "../../../domain/catalog"
import type { ProductId } from "../../../domain/pilot"
import type { PersistenceError } from "../errors"

// ============================================
// CATALOG PRODUCT REPOSITORY (Read Model)
// ============================================

export interface CatalogProductRepository {
  readonly upsert: (
    product: CatalogProduct
  ) => Effect.Effect<CatalogProduct, PersistenceError>

  readonly findById: (
    id: ProductId
  ) => Effect.Effect<Option.Option<CatalogProduct>, PersistenceError>

  readonly findAll: () => Effect.Effect<readonly CatalogProduct[], PersistenceError>
}

export const CatalogProductRepository = Context.GenericTag<CatalogProductRepository>(
  "CatalogProductRepository"
)
