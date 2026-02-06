// src/ports/driven/services/clock.ts

import { Context } from 'effect'
import type { Effect } from 'effect/Effect'

// ============================================
// CLOCK
// ============================================

export interface ClockService {
  readonly now: () => Effect<Date>
}

export class Clock extends Context.Tag('Clock')<Clock, ClockService>() {}
