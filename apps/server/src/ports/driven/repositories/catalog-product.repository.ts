// src/ports/driven/repositories/catalog-product.repository.ts

import { Context } from 'effect'
import type { ProductId } from '@maison-amane/shared-kernel'
import type { Effect } from 'effect/Effect'
import type { Option } from 'effect/Option'

import type { CatalogProduct } from '../../../domain/catalog'

import type { PersistenceError } from './errors'

// ============================================
// CATALOG PRODUCT REPOSITORY (Read Model)
// ============================================
//
// This interface differs from PilotProductRepository because:
// - CatalogProduct is a READ MODEL (CQRS pattern)
// - Uses `upsert` instead of `save`/`update` for idempotent projections
// - No separate create/update distinction needed for projections
//
// See PilotProductRepository for the WRITE MODEL interface.
// ============================================

export interface CatalogProductRepositoryService {
  readonly upsert: (product: CatalogProduct) => Effect<CatalogProduct, PersistenceError>

  readonly findById: (id: ProductId) => Effect<Option<CatalogProduct>, PersistenceError>
}

export class CatalogProductRepository extends Context.Tag('CatalogProductRepository')<
  CatalogProductRepository,
  CatalogProductRepositoryService
>() {}
