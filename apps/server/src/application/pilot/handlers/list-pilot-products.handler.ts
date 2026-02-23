// src/application/pilot/handlers/list-pilot-products.handler.ts

import { type Effect, gen } from 'effect/Effect'

import type { PilotProduct, PilotProductListError } from '../../../domain/pilot'
import { PilotProductRepository } from '../../../ports/driven'
import type { ListPilotProductsQuery } from '../queries'

// ============================================
// HANDLER: LIST PILOT PRODUCTS
// ============================================

export const listPilotProductsHandler = (
  _query: ListPilotProductsQuery
): Effect<ReadonlyArray<PilotProduct>, PilotProductListError, PilotProductRepository> =>
  gen(function* () {
    const repo = yield* PilotProductRepository
    return yield* repo.findAll() // TODO: paginated request evolution
  })
