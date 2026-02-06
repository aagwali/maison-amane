// src/ports/driven/repositories/pilot-product.repository.ts

import { Context } from 'effect'
import type { Effect } from 'effect/Effect'
import type { Option } from 'effect/Option'

import type { ProductId, PilotProduct } from '../../../domain/pilot'

import type { PersistenceError } from './errors'

// ============================================
// PILOT PRODUCT REPOSITORY (Write Model)
// ============================================

export interface PilotProductRepositoryService {
  readonly save: (product: PilotProduct) => Effect<PilotProduct, PersistenceError>

  readonly update: (product: PilotProduct) => Effect<PilotProduct, PersistenceError>

  readonly findById: (id: ProductId) => Effect<Option<PilotProduct>, PersistenceError>
}

export class PilotProductRepository extends Context.Tag('PilotProductRepository')<
  PilotProductRepository,
  PilotProductRepositoryService
>() {}
