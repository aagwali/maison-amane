// src/test-utils/deterministic-id-generator.ts
//
// TEST UTILITY: Generates predictable IDs for deterministic tests.
// Use this instead of UuidIdGenerator in tests to get reproducible results.

import { Effect, Layer } from 'effect'

import { makeProductId } from '../domain/pilot'
import { IdGenerator } from '../ports/driven'

export const stubIdGenerator = (prefix = 'test') => {
  let productCounter = 0
  let correlationCounter = 0

  return {
    generateProductId: () =>
      Effect.sync(() => {
        productCounter++
        return makeProductId(`${prefix}-product-${productCounter}`)
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

export type StubIdGenerator = ReturnType<typeof stubIdGenerator>

export const StubIdGeneratorLive = (prefix = 'test') =>
  Layer.succeed(IdGenerator, stubIdGenerator(prefix))
