// packages/api/src/errors/problem-detail.ts

import { Schema as S } from 'effect'

// ============================================
// RFC 7807 - PROBLEM DETAILS FOR HTTP APIs
// https://tools.ietf.org/html/rfc7807
// ============================================

// --------------------------------------------
// ERROR TYPE URI CONSTANTS
// --------------------------------------------

export const ERROR_TYPE_BASE_URI = 'https://maison-amane.com/errors'

export const ErrorTypeUris = {
  VALIDATION: `${ERROR_TYPE_BASE_URI}/validation-error`,
  PERSISTENCE: `${ERROR_TYPE_BASE_URI}/persistence-error`,
  NOT_FOUND: `${ERROR_TYPE_BASE_URI}/not-found`,
  INTERNAL: `${ERROR_TYPE_BASE_URI}/internal-error`,
} as const

// --------------------------------------------
// BASE FIELDS (RFC 7807 standard)
// Reusable field definitions for composition
// --------------------------------------------

export const ProblemDetailFields = {
  type: S.String,
  title: S.String,
  status: S.Number,
  detail: S.String,
  instance: S.String,
} as const

// --------------------------------------------
// CUSTOM EXTENSION FIELDS
// Domain-specific additions to RFC 7807
// --------------------------------------------

export const CustomExtensionFields = {
  correlationId: S.String,
  code: S.String,
  timestamp: S.String,
} as const

// --------------------------------------------
// COMPOSED SCHEMAS
// Built from base + extensions + specific fields
// --------------------------------------------

export const ProblemDetailSchema = S.Struct(ProblemDetailFields)

export type ProblemDetail = typeof ProblemDetailSchema.Type

export const ExtendedProblemDetailSchema = S.Struct({
  ...ProblemDetailFields,
  ...CustomExtensionFields,
})

export type ExtendedProblemDetail = typeof ExtendedProblemDetailSchema.Type

export const ValidationProblemDetailSchema = S.Struct({
  ...ProblemDetailFields,
  ...CustomExtensionFields,
  errors: S.Array(S.String),
})

export type ValidationProblemDetail = typeof ValidationProblemDetailSchema.Type

export const NotFoundProblemDetailSchema = S.Struct({
  ...ProblemDetailFields,
  ...CustomExtensionFields,
  resource: S.String,
  resourceId: S.String,
})

export type NotFoundProblemDetail = typeof NotFoundProblemDetailSchema.Type

// --------------------------------------------
// UNION TYPE (for generic handling)
// --------------------------------------------

export const ApiProblemDetailSchema = S.Union(
  ValidationProblemDetailSchema,
  NotFoundProblemDetailSchema,
  ExtendedProblemDetailSchema
)

export type ApiProblemDetail = typeof ApiProblemDetailSchema.Type
