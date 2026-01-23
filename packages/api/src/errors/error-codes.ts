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
  INVALID_VARIANT_DATA: 'PILOT_VALIDATION_002',
  INVALID_VIEWS_DATA: 'PILOT_VALIDATION_003',
  MISSING_REQUIRED_FIELD: 'PILOT_VALIDATION_004',
  INVALID_PRICE_RANGE: 'PILOT_VALIDATION_005',
  INVALID_DIMENSIONS: 'PILOT_VALIDATION_006',
} as const

export type ValidationErrorCode = typeof ValidationErrorCodes[keyof typeof ValidationErrorCodes]

// --------------------------------------------
// PERSISTENCE ERRORS (5xx)
// --------------------------------------------

export const PersistenceErrorCodes = {
  SAVE_FAILED: 'PILOT_PERSISTENCE_001',
  UPDATE_FAILED: 'PILOT_PERSISTENCE_002',
  DELETE_FAILED: 'PILOT_PERSISTENCE_003',
  CONNECTION_ERROR: 'PILOT_PERSISTENCE_004',
} as const

export type PersistenceErrorCode = typeof PersistenceErrorCodes[keyof typeof PersistenceErrorCodes]

// --------------------------------------------
// NOT FOUND ERRORS (404)
// --------------------------------------------

export const NotFoundErrorCodes = {
  PRODUCT_NOT_FOUND: 'PILOT_NOT_FOUND_001',
  VARIANT_NOT_FOUND: 'PILOT_NOT_FOUND_002',
} as const

export type NotFoundErrorCode = typeof NotFoundErrorCodes[keyof typeof NotFoundErrorCodes]

// --------------------------------------------
// SYSTEM ERRORS (5xx)
// --------------------------------------------

export const SystemErrorCodes = {
  INTERNAL_ERROR: 'SYSTEM_ERROR_001',
  SERVICE_UNAVAILABLE: 'SYSTEM_ERROR_002',
  CONFIGURATION_ERROR: 'SYSTEM_ERROR_003',
} as const

export type SystemErrorCode = typeof SystemErrorCodes[keyof typeof SystemErrorCodes]

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
  // Validation
  [ValidationErrorCodes.INVALID_PRODUCT_DATA]: 'Invalid Product Data',
  [ValidationErrorCodes.INVALID_VARIANT_DATA]: 'Invalid Variant Data',
  [ValidationErrorCodes.INVALID_VIEWS_DATA]: 'Invalid Views Data',
  [ValidationErrorCodes.MISSING_REQUIRED_FIELD]: 'Missing Required Field',
  [ValidationErrorCodes.INVALID_PRICE_RANGE]: 'Invalid Price Range',
  [ValidationErrorCodes.INVALID_DIMENSIONS]: 'Invalid Dimensions',
  // Persistence
  [PersistenceErrorCodes.SAVE_FAILED]: 'Save Operation Failed',
  [PersistenceErrorCodes.UPDATE_FAILED]: 'Update Operation Failed',
  [PersistenceErrorCodes.DELETE_FAILED]: 'Delete Operation Failed',
  [PersistenceErrorCodes.CONNECTION_ERROR]: 'Database Connection Error',
  // Not Found
  [NotFoundErrorCodes.PRODUCT_NOT_FOUND]: 'Product Not Found',
  [NotFoundErrorCodes.VARIANT_NOT_FOUND]: 'Variant Not Found',
  // System
  [SystemErrorCodes.INTERNAL_ERROR]: 'Internal Server Error',
  [SystemErrorCodes.SERVICE_UNAVAILABLE]: 'Service Unavailable',
  [SystemErrorCodes.CONFIGURATION_ERROR]: 'Configuration Error',
}
