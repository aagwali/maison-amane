// packages/api/src/dtos/errors.ts

import { Schema as S } from 'effect'

// ============================================
// VALIDATION ERROR RESPONSE (400)
// ============================================

export class ApiValidationError extends S.TaggedClass<ApiValidationError>()('ApiValidationError', {
  message: S.String,
  details: S.optional(S.Array(S.String)),
}) {}

// ============================================
// PERSISTENCE ERROR RESPONSE (500)
// ============================================

export class ApiPersistenceError extends S.TaggedClass<ApiPersistenceError>()('ApiPersistenceError', {
  message: S.String,
}) {}

// ============================================
// NOT FOUND ERROR RESPONSE (404)
// ============================================

export class ApiNotFoundError extends S.TaggedClass<ApiNotFoundError>()('ApiNotFoundError', {
  resource: S.String,
  id: S.String,
}) {}
