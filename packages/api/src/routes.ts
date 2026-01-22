// packages/api/src/routes.ts

import { HttpApi, HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import {
  CreatePilotProductRequest,
  PilotProductResponse,
  ApiValidationError,
  ApiPersistenceError,
} from './dtos'

// ============================================
// PILOT PRODUCT API GROUP
// ============================================

export class PilotProductGroup extends HttpApiGroup.make('pilot-product')
  .add(
    HttpApiEndpoint.post('create', '/pilot-product')
      .setPayload(CreatePilotProductRequest)
      .addSuccess(PilotProductResponse)
      .addError(ApiValidationError)
      .addError(ApiPersistenceError)
  )
  .prefix('/api') {}

// ============================================
// MAIN API
// ============================================

export class MaisonAmaneApi extends HttpApi.make('maison-amane-api').add(PilotProductGroup) {}
