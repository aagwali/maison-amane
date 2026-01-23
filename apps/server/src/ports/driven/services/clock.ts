// src/ports/driven/services/clock.ts

import { Context, Effect } from 'effect'

// ============================================
// CLOCK
// ============================================

export interface Clock {
  readonly now: () => Effect.Effect<Date>
}

export const Clock = Context.GenericTag<Clock>("Clock")
