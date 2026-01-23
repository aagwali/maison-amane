// src/infrastructure/services/system-clock.ts

import { Effect, Layer } from 'effect'

import { Clock } from '../../ports/driven'

// ============================================
// SYSTEM CLOCK
// ============================================

export const SystemClockLive = Layer.succeed(
  Clock,
  {
    now: () => Effect.succeed(new Date())
  }
)
