// src/ports/driven/services/clock.ts

import { Context, Effect } from 'effect'

// ============================================
// CLOCK
// ============================================

export interface ClockService {
  readonly now: () => Effect.Effect<Date>
}

export class Clock extends Context.Tag("Clock")<
  Clock,
  ClockService
>() {}
