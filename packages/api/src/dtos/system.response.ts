// packages/api/src/dtos/system.response.ts

import { Schema as S } from 'effect'

// ============================================
// HEALTH CHECK RESPONSE
// ============================================

export class HealthCheckResponse extends S.Class<HealthCheckResponse>('HealthCheckResponse')({
  status: S.Literal('ok', 'degraded'),
  timestamp: S.String,
  services: S.Struct({
    database: S.Literal('up', 'down', 'not_configured'),
  }),
}) {}
