// src/ports/driven/errors.ts

import { Data } from "effect"

// ============================================
// PERSISTENCE ERROR
// ============================================

export class PersistenceError extends Data.TaggedError("PersistenceError")<{
  readonly cause: unknown
}> {}
