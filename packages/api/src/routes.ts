// packages/api/src/routes.ts

import { HttpApi, HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import {
  CreatePilotProductRequest,
  PilotProductResponse,
  HealthCheckResponse,
  ApiValidationError,
  ApiPersistenceError,
} from './dtos'

// ============================================
// SYSTEM API GROUP (Health, Readiness)
// ============================================

export class SystemGroup extends HttpApiGroup.make('system')
  .add(
    HttpApiEndpoint.get('health', '/health')
      .addSuccess(HealthCheckResponse)
  ) {}

// ============================================
// PILOT PRODUCT API GROUP
// ============================================

export class PilotProductGroup extends HttpApiGroup.make('pilot-product')
  .add(
    HttpApiEndpoint.post('create', '/pilot-product')
      .setPayload(CreatePilotProductRequest)
      .addSuccess(PilotProductResponse)
      .addError(ApiValidationError, { status: 400 })
      .addError(ApiPersistenceError, { status: 500 })
  )
  .prefix('/api') {}

// ============================================
// MAIN API
// ============================================

export class MaisonAmaneApi extends HttpApi.make('maison-amane-api')
  .add(SystemGroup)
  .add(PilotProductGroup) {}
