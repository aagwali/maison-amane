// packages/api/src/errors/error-codes.ts

// ============================================
// BUSINESS ERROR CODES CATALOG
// Standardized error codes for programmatic handling
// ============================================

// --------------------------------------------
// VALIDATION ERRORS (4xx)
// --------------------------------------------

export const ValidationErrorCodes = {
  INVALID_PRODUCT_DATA: 'PILOT_VALIDATION_001',
} as const

export type ValidationErrorCode = (typeof ValidationErrorCodes)[keyof typeof ValidationErrorCodes]

// --------------------------------------------
// PERSISTENCE ERRORS (5xx)
// --------------------------------------------

export const PersistenceErrorCodes = {
  SAVE_FAILED: 'PILOT_PERSISTENCE_001',
} as const

export type PersistenceErrorCode =
  (typeof PersistenceErrorCodes)[keyof typeof PersistenceErrorCodes]

// --------------------------------------------
// NOT FOUND ERRORS (404)
// --------------------------------------------

export const NotFoundErrorCodes = {
  PRODUCT_NOT_FOUND: 'PILOT_NOT_FOUND_001',
} as const

export type NotFoundErrorCode = (typeof NotFoundErrorCodes)[keyof typeof NotFoundErrorCodes]

// --------------------------------------------
// SYSTEM ERRORS (5xx)
// --------------------------------------------

export const SystemErrorCodes = {
  INTERNAL_ERROR: 'SYSTEM_ERROR_001',
} as const

export type SystemErrorCode = (typeof SystemErrorCodes)[keyof typeof SystemErrorCodes]

// --------------------------------------------
// UNION TYPE
// --------------------------------------------

export type ErrorCode =
  | ValidationErrorCode
  | PersistenceErrorCode
  | NotFoundErrorCode
  | SystemErrorCode

// --------------------------------------------
// ERROR CODE METADATA
// Human-readable titles for each error code
// --------------------------------------------

export const ErrorCodeTitles: Record<ErrorCode, string> = {
  [ValidationErrorCodes.INVALID_PRODUCT_DATA]: 'Invalid Product Data',
  [PersistenceErrorCodes.SAVE_FAILED]: 'Save Operation Failed',
  [NotFoundErrorCodes.PRODUCT_NOT_FOUND]: 'Product Not Found',
  [SystemErrorCodes.INTERNAL_ERROR]: 'Internal Server Error',
}
