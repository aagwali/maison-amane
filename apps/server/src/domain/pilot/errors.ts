// src/domain/pilot/errors.ts

import { Data } from 'effect'
import type { ParseError } from 'effect/ParseResult'

import type { PersistenceError } from '../../ports/driven'

// ============================================
// VALIDATION ERROR
// ============================================

export class ValidationError extends Data.TaggedError('ValidationError')<{
  readonly cause: ParseError
}> {
  static fromParseError(cause: ParseError): ValidationError {
    return new ValidationError({ cause })
  }
}

// ============================================
// PRODUCT NOT FOUND ERROR
// ============================================

export class ProductNotFoundError extends Data.TaggedError('ProductNotFoundError')<{
  readonly productId: string
}> {}

// ============================================
// PUBLICATION / ARCHIVE ERRORS
// ============================================

export class PublicationNotAllowed extends Data.TaggedError('PublicationNotAllowed')<{
  readonly reason: string
}> {}

export class ArchiveNotAllowed extends Data.TaggedError('ArchiveNotAllowed')<{
  readonly reason: string
}> {}

// ============================================
// AGGREGATE ERROR TYPES
// ============================================

export type PilotProductCreationError = ValidationError | PersistenceError

export type PilotProductUpdateError =
  | ValidationError
  | PersistenceError
  | ProductNotFoundError
  | PublicationNotAllowed
  | ArchiveNotAllowed

export type PilotProductQueryError = PersistenceError | ProductNotFoundError
