// src/ports/driven/repositories/catalog-product.repository.ts

import { Context, Effect, Option } from 'effect'
import type { ProductId } from '@maison-amane/shared-kernel'

import type { CatalogProduct } from '../../../domain/catalog'
import type { PersistenceError } from '../errors'

// ============================================
// CATALOG PRODUCT REPOSITORY (Read Model)
// ============================================
//
// This interface differs from PilotProductRepository because:
// - CatalogProduct is a READ MODEL (CQRS pattern)
// - Uses `upsert` instead of `save`/`update` for idempotent projections
// - Includes `findAll` for listing (UI-oriented queries)
// - No separate create/update distinction needed for projections
//
// See PilotProductRepository for the WRITE MODEL interface.
// ============================================

export interface CatalogProductRepositoryService {
  readonly upsert: (product: CatalogProduct) => Effect.Effect<CatalogProduct, PersistenceError>

  readonly findById: (
    id: ProductId
  ) => Effect.Effect<Option.Option<CatalogProduct>, PersistenceError>

  readonly findAll: () => Effect.Effect<readonly CatalogProduct[], PersistenceError>
}

export class CatalogProductRepository extends Context.Tag('CatalogProductRepository')<
  CatalogProductRepository,
  CatalogProductRepositoryService
>() {}
