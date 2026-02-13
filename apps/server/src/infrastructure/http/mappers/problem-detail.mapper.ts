// src/infrastructure/http/mappers/problem-detail.mapper.ts

import {
  ApiInternalError,
  ApiNotFoundError,
  ApiPersistenceError,
  ApiValidationError,
  ErrorCodeTitles,
  ErrorTypeUris,
  NotFoundErrorCodes,
  PersistenceErrorCodes,
  SystemErrorCodes,
  ValidationErrorCodes,
} from '@maison-amane/api'

import type {
  ValidationError,
  PilotProductCreationError,
  PilotProductUpdateError,
  ProductNotFoundError,
} from '../../../domain/pilot'
import type { PersistenceError } from '../../../ports/driven'

import { formatValidationError } from './error.mapper'
// ============================================
// ERROR CONTEXT
// Information needed to build ProblemDetail
// ============================================

export interface ErrorContext {
  readonly correlationId: string
  readonly instance: string // e.g., "/api/pilot-product"
}

// ============================================
// TYPE GUARDS
// ============================================

const isValidationError = (
  error: PilotProductCreationError | PilotProductUpdateError
): error is ValidationError => '_tag' in error && error._tag === 'ValidationError'

const isPersistenceError = (
  error: PilotProductCreationError | PilotProductUpdateError
): error is PersistenceError => '_tag' in error && error._tag === 'PersistenceError'

const isProductNotFoundError = (error: PilotProductUpdateError): error is ProductNotFoundError =>
  '_tag' in error && error._tag === 'ProductNotFoundError'

// ============================================
// PROBLEM DETAIL FACTORIES
// ============================================

const createTimestamp = (): string => new Date().toISOString()

export const toValidationProblemDetail = (
  error: ValidationError,
  ctx: ErrorContext
): ApiValidationError => {
  const errors = formatValidationError(error.cause)
  const code = ValidationErrorCodes.INVALID_PRODUCT_DATA

  return new ApiValidationError({
    type: ErrorTypeUris.VALIDATION,
    title: ErrorCodeTitles[code],
    status: 400,
    detail: 'The request contains invalid data. See errors for details.',
    instance: ctx.instance,
    correlationId: ctx.correlationId,
    code,
    timestamp: createTimestamp(),
    errors,
  })
}

export const toPersistenceProblemDetail = (
  _error: PersistenceError,
  ctx: ErrorContext
): ApiPersistenceError => {
  const code = PersistenceErrorCodes.SAVE_FAILED

  return new ApiPersistenceError({
    type: ErrorTypeUris.PERSISTENCE,
    title: ErrorCodeTitles[code],
    status: 500,
    detail: 'An error occurred while persisting the data. Please try again.',
    instance: ctx.instance,
    correlationId: ctx.correlationId,
    code,
    timestamp: createTimestamp(),
  })
}

export const toNotFoundProblemDetail = (
  resource: string,
  resourceId: string,
  ctx: ErrorContext
): ApiNotFoundError => {
  const code = NotFoundErrorCodes.PRODUCT_NOT_FOUND

  return new ApiNotFoundError({
    type: ErrorTypeUris.NOT_FOUND,
    title: ErrorCodeTitles[code],
    status: 404,
    detail: `The requested ${resource} with id '${resourceId}' was not found.`,
    instance: ctx.instance,
    correlationId: ctx.correlationId,
    code,
    timestamp: createTimestamp(),
    resource,
    resourceId,
  })
}

export const toInternalProblemDetail = (ctx: ErrorContext): ApiInternalError => {
  const code = SystemErrorCodes.INTERNAL_ERROR

  return new ApiInternalError({
    type: ErrorTypeUris.INTERNAL,
    title: ErrorCodeTitles[code],
    status: 500,
    detail: 'An unexpected error occurred. Please contact support with the correlationId.',
    instance: ctx.instance,
    correlationId: ctx.correlationId,
    code,
    timestamp: createTimestamp(),
  })
}

// ============================================
// UNIFIED MAPPER
// Transforms domain errors to RFC 7807 format
// ============================================

export const toProblemDetail = (
  error: PilotProductCreationError,
  ctx: ErrorContext
): ApiValidationError | ApiPersistenceError | ApiInternalError => {
  if (isValidationError(error)) {
    return toValidationProblemDetail(error, ctx)
  }

  if (isPersistenceError(error)) {
    return toPersistenceProblemDetail(error, ctx)
  }

  // Fallback for unexpected errors
  return toInternalProblemDetail(ctx)
}

export const toUpdateProblemDetail = (
  error: PilotProductUpdateError,
  ctx: ErrorContext
): ApiValidationError | ApiPersistenceError | ApiNotFoundError | ApiInternalError => {
  if (isValidationError(error)) {
    return toValidationProblemDetail(error, ctx)
  }

  if (isProductNotFoundError(error)) {
    return toNotFoundProblemDetail('PilotProduct', error.productId, ctx)
  }

  if (isPersistenceError(error)) {
    return toPersistenceProblemDetail(error, ctx)
  }

  // Fallback for unexpected errors
  return toInternalProblemDetail(ctx)
}
