// src/test-utils/deterministic-id-generator.ts
//
// TEST UTILITY: Generates predictable IDs for deterministic tests.
// Use this instead of UuidIdGenerator in tests to get reproducible results.

import { Effect, Layer } from 'effect'

import { MakeProductId } from '../domain/pilot'
import { IdGenerator } from '../ports/driven'

export const makeDeterministicIdGenerator = (prefix = "test") => {
  let productCounter = 0
  let correlationCounter = 0

  return {
    generateProductId: () =>
      Effect.sync(() => {
        productCounter++
        return MakeProductId(`${prefix}-product-${productCounter}`)
      }),

    generateCorrelationId: () =>
      Effect.sync(() => {
        correlationCounter++
        return `${prefix}-correlation-${correlationCounter}`
      }),

    // Reset counters between tests
    reset: () => {
      productCounter = 0
      correlationCounter = 0
    },
  }
}

export type DeterministicIdGenerator = ReturnType<typeof makeDeterministicIdGenerator>

export const DeterministicIdGeneratorLive = (prefix = "test") =>
  Layer.succeed(IdGenerator, makeDeterministicIdGenerator(prefix))
