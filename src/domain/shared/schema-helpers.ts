// src/domain/shared/schema-helpers.ts

import * as S from "effect/Schema"
import { Enums } from "effect/Schema"
import type { SchemaAST } from "effect"
import type { ParseIssue } from "effect/ParseResult"

// ============================================
// TAGGED SCHEMA FACTORY
// ============================================

export const TaggedSchema = <
  Tag extends SchemaAST.LiteralValue,
  Fields extends S.Struct.Fields,
>(
  tag: Tag,
  fields: Fields,
) =>
  S.Struct({
    _tag: S.Literal(tag).pipe(S.optional),
    ...fields,
  }).annotations({
    identifier: String(tag),
  })

// ============================================
// ENUM SCHEMA FACTORY
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
