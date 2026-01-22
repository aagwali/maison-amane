// src/domain/pilot/errors.ts

import { Data } from "effect"
import type { ParseError } from "effect/ParseResult"
import type { PersistenceError } from "../../ports/driven"

// ============================================
// VALIDATION ERROR
// ============================================

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly cause: ParseError
}> {
  static fromParseError(cause: ParseError): ValidationError {
    return new ValidationError({ cause })
  }
}

// ============================================
// AGGREGATE ERROR TYPE
// ============================================

export type PilotProductCreationError = ValidationError | PersistenceError
