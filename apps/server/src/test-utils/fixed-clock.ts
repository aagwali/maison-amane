// src/test-utils/fixed-clock.ts
//
// TEST UTILITY: Returns a fixed date for deterministic time-based tests.
// Use this instead of SystemClock in tests.

import { Effect, Layer } from 'effect'

import { Clock } from '../ports/driven'

export const TEST_DATE = new Date("2024-01-15T10:00:00.000Z")

export const stubClock = (fixedDate: Date = TEST_DATE) => ({
  now: () => Effect.succeed(fixedDate),
})

export const StubClockLive = (fixedDate: Date = TEST_DATE) =>
  Layer.succeed(Clock, stubClock(fixedDate))
