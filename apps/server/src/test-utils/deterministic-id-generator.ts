// src/test-utils/deterministic-id-generator.ts
//
// TEST UTILITY: Generates predictable IDs for deterministic tests.
// Use this instead of UuidIdGenerator in tests to get reproducible results.

import { Layer } from 'effect'
import { sync } from 'effect/Effect'

import { makeProductId } from '../domain/pilot'
import { makeMediaId } from '../domain/media'
import { IdGenerator } from '../ports/driven'

export const stubIdGenerator = (prefix = 'test') => {
  let productCounter = 0
  let mediaCounter = 0
  let correlationCounter = 0

  return {
    generateProductId: () =>
      sync(() => {
        productCounter++
        return makeProductId(`${prefix}-product-${productCounter}`)
      }),

    generateMediaId: () =>
      sync(() => {
        mediaCounter++
        return makeMediaId(`${prefix}-media-${mediaCounter}`)
      }),

    generateCorrelationId: () =>
      sync(() => {
        correlationCounter++
        return `${prefix}-correlation-${correlationCounter}`
      }),

    // Reset counters between tests
    reset: () => {
      productCounter = 0
      mediaCounter = 0
      correlationCounter = 0
    },
  }
}

export type StubIdGenerator = ReturnType<typeof stubIdGenerator>

export const StubIdGeneratorLive = (prefix = 'test') =>
  Layer.succeed(IdGenerator, stubIdGenerator(prefix))
