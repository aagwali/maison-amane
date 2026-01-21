// src/domain/pilote/errors.ts

import type { ParseError } from "effect/ParseResult"

// ============================================
// VALIDATION ERROR (wraps ParseError)
// ============================================

export interface ValidationError {
  readonly _tag: "ValidationError"
  readonly cause: ParseError
}

export const ValidationError = {
  fromParseError: (cause: ParseError): ValidationError => ({
    _tag: "ValidationError",
    cause
  })
}

// ============================================
// PERSISTENCE ERROR
// ============================================

export interface PersistenceError {
  readonly _tag: "PersistenceError"
  readonly cause: unknown
}

export const PersistenceError = {
  create: (cause: unknown): PersistenceError => ({
    _tag: "PersistenceError",
    cause
  })
}

// ============================================
// AGGREGATE ERROR TYPE
// ============================================

export type CreateProductError = ValidationError | PersistenceError
