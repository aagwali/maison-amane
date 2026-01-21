// src/domain/pilot/errors.ts

import * as S from "effect/Schema"
import { case as constructor } from "effect/Data"
import type { ParseError } from "effect/ParseResult"
import { TaggedSchema } from "../shared"

// ============================================
// VALIDATION ERROR (wraps ParseError)
// ============================================

const ParseErrorSchema = S.Any as S.Schema<ParseError>

const ValidationErrorSchema = TaggedSchema("ValidationError", {
  cause: ParseErrorSchema,
})

export type ValidationError = typeof ValidationErrorSchema.Type

const MakeValidationError = constructor<ValidationError>()

export const ValidationError = {
  fromParseError: (cause: ParseError): ValidationError =>
    MakeValidationError({ cause }),
}

// ============================================
// PERSISTENCE ERROR
// ============================================

const PersistenceErrorSchema = TaggedSchema("PersistenceError", {
  cause: S.Unknown,
})

export type PersistenceError = typeof PersistenceErrorSchema.Type

export const MakePersistenceError = constructor<PersistenceError>()

// ============================================
// AGGREGATE ERROR TYPE
// ============================================

export type CreateProductError = ValidationError | PersistenceError
