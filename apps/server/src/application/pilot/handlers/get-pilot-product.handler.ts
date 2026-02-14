// src/application/pilot/handlers/get-pilot-product.handler.ts

import { type Effect, gen } from 'effect/Effect'

import type { PilotProduct, PilotProductQueryError } from '../../../domain/pilot'
import { PilotProductRepository } from '../../../ports/driven'
import type { GetPilotProductQuery } from '../queries'

// ============================================
// HANDLER: GET PILOT PRODUCT
// ============================================

export const getPilotProductHandler = (
  query: GetPilotProductQuery
): Effect<PilotProduct, PilotProductQueryError, PilotProductRepository> =>
  gen(function* () {
    const repo = yield* PilotProductRepository
    return yield* repo.getById(query.productId)
  })
