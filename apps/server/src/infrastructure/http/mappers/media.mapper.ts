// src/infrastructure/http/mappers/media.mapper.ts

import type { ApiPersistenceError, ApiInternalError } from '@maison-amane/api'

import type { MediaRegistrationError } from '../../../application/media'

import type { ErrorContext } from './problem-detail.mapper'
import { toPersistenceProblemDetail, toInternalProblemDetail } from './problem-detail.mapper'

// ============================================
// MEDIA ERROR MAPPER
// ============================================
// Maps media registration errors to RFC 7807 problem details
// MediaRegistrationError only contains PersistenceError (CDN upload pattern)

export const toMediaProblemDetail = (
  error: MediaRegistrationError,
  ctx: ErrorContext
): ApiPersistenceError | ApiInternalError => {
  if (error._tag === 'PersistenceError') {
    return toPersistenceProblemDetail(error, ctx)
  }

  return toInternalProblemDetail(ctx)
}
