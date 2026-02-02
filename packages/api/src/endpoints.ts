// packages/api/src/endpoints.ts

// ============================================
// API ENDPOINTS CONSTANTS
// Single source of truth for paths
// ============================================

export const ApiPrefix = '/api' as const

export const Endpoints = {
  PILOT_PRODUCT: '/pilot-product',
  PILOT_PRODUCT_BY_ID: '/pilot-product/:id',
  HEALTH: '/health',
} as const

export const FullPaths = {
  PILOT_PRODUCT: `${ApiPrefix}${Endpoints.PILOT_PRODUCT}`,
  PILOT_PRODUCT_BY_ID: `${ApiPrefix}${Endpoints.PILOT_PRODUCT_BY_ID}`,
  HEALTH: Endpoints.HEALTH,
} as const

// ============================================
// API GROUP NAMES
// Used in routes and handlers
// ============================================

export const GroupNames = {
  PILOT_PRODUCT: 'pilot-product',
  SYSTEM: 'system',
} as const
