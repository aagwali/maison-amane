// packages/api/src/routes.ts

import { HttpApi, HttpApiEndpoint, HttpApiGroup } from '@effect/platform'

import {
  ApiInternalError,
  ApiPersistenceError,
  ApiValidationError,
  CreatePilotProductRequest,
  HealthCheckResponse,
  PilotProductResponse,
} from './dtos'
import { ApiPrefix, Endpoints, GroupNames } from './endpoints'

// ============================================
// SYSTEM API GROUP (Health, Readiness)
// ============================================

export class SystemGroup extends HttpApiGroup.make(GroupNames.SYSTEM)
  .add(
    HttpApiEndpoint.get('health', Endpoints.HEALTH)
      .addSuccess(HealthCheckResponse)
  ) {}

// ============================================
// PILOT PRODUCT API GROUP
// ============================================

export class PilotProductGroup extends HttpApiGroup.make(GroupNames.PILOT_PRODUCT)
  .add(
    HttpApiEndpoint.post('create', Endpoints.PILOT_PRODUCT)
      .setPayload(CreatePilotProductRequest)
      .addSuccess(PilotProductResponse)
      .addError(ApiValidationError, { status: ApiValidationError.status })
      .addError(ApiPersistenceError, { status: ApiPersistenceError.status })
      .addError(ApiInternalError, { status: ApiInternalError.status })
  )
  .prefix(ApiPrefix) {}

// ============================================
// MAIN API
// ============================================

export class MaisonAmaneApi extends HttpApi.make('maison-amane-api')
  .add(SystemGroup)
  .add(PilotProductGroup) {}
