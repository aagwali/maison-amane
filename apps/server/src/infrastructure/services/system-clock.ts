// src/infrastructure/services/system-clock.ts

import { Layer } from 'effect'
import { succeed } from 'effect/Effect'

import { Clock } from '../../ports/driven'

// ============================================
// SYSTEM CLOCK
// ============================================

export const SystemClockLive = Layer.succeed(Clock, {
  now: () => succeed(new Date()),
})
