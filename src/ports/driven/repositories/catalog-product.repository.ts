// src/ports/driven/repositories/catalog-product.repository.ts

import { Context, Effect, Option } from "effect"
import type { CatalogProduct } from "../../../domain/catalog"
import type { ProductId } from "../../../domain/pilot"

// ============================================
// CATALOG PRODUCT REPOSITORY (Read Model)
// ============================================

export interface CatalogProductRepository {
  readonly upsert: (
    product: CatalogProduct
  ) => Effect.Effect<CatalogProduct, unknown>

  readonly findById: (
    id: ProductId
  ) => Effect.Effect<Option.Option<CatalogProduct>, unknown>

  readonly findAll: () => Effect.Effect<readonly CatalogProduct[], unknown>
}

export const CatalogProductRepository = Context.GenericTag<CatalogProductRepository>(
  "CatalogProductRepository"
)
