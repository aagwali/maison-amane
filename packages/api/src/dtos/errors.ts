// packages/api/src/dtos/errors.ts

import { Schema as S } from 'effect'
import { ProblemDetailFields, CustomExtensionFields } from '../errors/problem-detail'

// ============================================
// API ERROR RESPONSES - RFC 7807 COMPLIANT
// Problem Details for HTTP APIs
// ============================================

// --------------------------------------------
// HTTP STATUS CODES (single source of truth)
// --------------------------------------------

export const HttpStatus = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const

// --------------------------------------------
// HELPER: Override status with specific literal
// --------------------------------------------

const withStatus = <N extends number>(status: N) => ({
  ...ProblemDetailFields,
  status: S.Literal(status),
})

// --------------------------------------------
// VALIDATION ERROR RESPONSE (400)
// --------------------------------------------

export class ApiValidationError extends S.TaggedClass<ApiValidationError>()(
  'ApiValidationError',
  {
    ...withStatus(HttpStatus.BAD_REQUEST),
    ...CustomExtensionFields,
    errors: S.Array(S.String),
  }
) {
  static readonly status = HttpStatus.BAD_REQUEST
}

// --------------------------------------------
// PERSISTENCE ERROR RESPONSE (500)
// --------------------------------------------

export class ApiPersistenceError extends S.TaggedClass<ApiPersistenceError>()(
  'ApiPersistenceError',
  {
    ...withStatus(HttpStatus.INTERNAL_SERVER_ERROR),
    ...CustomExtensionFields,
  }
) {
  static readonly status = HttpStatus.INTERNAL_SERVER_ERROR
}

// --------------------------------------------
// NOT FOUND ERROR RESPONSE (404)
// --------------------------------------------

export class ApiNotFoundError extends S.TaggedClass<ApiNotFoundError>()(
  'ApiNotFoundError',
  {
    ...withStatus(HttpStatus.NOT_FOUND),
    ...CustomExtensionFields,
    resource: S.String,
    resourceId: S.String,
  }
) {
  static readonly status = HttpStatus.NOT_FOUND
}

// --------------------------------------------
// INTERNAL ERROR RESPONSE (500)
// --------------------------------------------

export class ApiInternalError extends S.TaggedClass<ApiInternalError>()(
  'ApiInternalError',
  {
    ...withStatus(HttpStatus.INTERNAL_SERVER_ERROR),
    ...CustomExtensionFields,
  }
) {
  static readonly status = HttpStatus.INTERNAL_SERVER_ERROR
}
