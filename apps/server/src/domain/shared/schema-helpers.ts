// src/domain/shared/schema-helpers.ts

import * as S from "effect/Schema"
import { Enums } from "effect/Schema"
import type { ParseIssue } from "effect/ParseResult"

// ============================================
// ENUM SCHEMA FACTORY (using Enums)
// ============================================

const formatEnumParseError =
  (type: Record<string, string | number>) => (value: ParseIssue) =>
    `Expected one of: ${Object.values(type).join(" | ")}, actual "${value.actual}"`

export const createEnumSchema = <T extends Record<string, string | number>>(
  enumObject: T,
) =>
  Enums(enumObject).annotations({
    message: formatEnumParseError(enumObject),
  })

// ============================================
// LITERAL ENUM SCHEMA FACTORY (using Literal)
// ============================================

export const fromEnum = <T extends Record<string, string>>(e: T) =>
  S.Literal(...Object.values(e) as [T[keyof T], ...T[keyof T][]])
