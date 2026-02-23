// packages/api/src/routes.ts

import { HttpApi, HttpApiEndpoint, HttpApiGroup } from '@effect/platform'
import { Schema as S } from 'effect'

import {
  ApiInternalError,
  ApiNotFoundError,
  ApiPersistenceError,
  ApiValidationError,
  CreatePilotProductRequest,
  HealthCheckResponse,
  MediaRegistrationResponse,
  PilotProductResponse,
  UpdatePilotProductRequest,
  RegisterMediaRequest,
} from './dtos'
import { ApiPrefix, Endpoints, GroupNames } from './endpoints'

// ============================================
// SYSTEM API GROUP (Health, Readiness)
// ============================================

export class SystemGroup extends HttpApiGroup.make(GroupNames.SYSTEM).add(
  HttpApiEndpoint.get('health', Endpoints.HEALTH).addSuccess(HealthCheckResponse)
) {}

// ============================================
// PILOT PRODUCT API GROUP
// ============================================

export class PilotProductGroup extends HttpApiGroup.make(GroupNames.PILOT_PRODUCT)
  .add(
    HttpApiEndpoint.get('listAll', Endpoints.PILOT_PRODUCT)
      .addSuccess(S.Array(PilotProductResponse))
      .addError(ApiPersistenceError, { status: ApiPersistenceError.status })
      .addError(ApiInternalError, { status: ApiInternalError.status })
  )
  .add(
    HttpApiEndpoint.post('create', Endpoints.PILOT_PRODUCT)
      .setPayload(CreatePilotProductRequest)
      .addSuccess(PilotProductResponse)
      .addError(ApiValidationError, { status: ApiValidationError.status })
      .addError(ApiPersistenceError, { status: ApiPersistenceError.status })
      .addError(ApiInternalError, { status: ApiInternalError.status })
  )
  .add(
    HttpApiEndpoint.put('update', Endpoints.PILOT_PRODUCT_BY_ID)
      .setPath(S.Struct({ id: S.String }))
      .setPayload(UpdatePilotProductRequest)
      .addSuccess(PilotProductResponse)
      .addError(ApiValidationError, { status: ApiValidationError.status })
      .addError(ApiNotFoundError, { status: ApiNotFoundError.status })
      .addError(ApiPersistenceError, { status: ApiPersistenceError.status })
      .addError(ApiInternalError, { status: ApiInternalError.status })
  )
  .add(
    HttpApiEndpoint.get('getById', Endpoints.PILOT_PRODUCT_BY_ID)
      .setPath(S.Struct({ id: S.String }))
      .addSuccess(PilotProductResponse)
      .addError(ApiNotFoundError, { status: ApiNotFoundError.status })
      .addError(ApiPersistenceError, { status: ApiPersistenceError.status })
      .addError(ApiInternalError, { status: ApiInternalError.status })
  )
  .prefix(ApiPrefix) {}

// ============================================
// MEDIA API GROUP
// ============================================
//
// NOTE: Expects externalUrl from CDN (Cloudinary, S3, etc.)
// Frontend uploads directly to media server, then calls this endpoint with the URL

export class MediaGroup extends HttpApiGroup.make(GroupNames.MEDIA)
  .add(
    HttpApiEndpoint.post('register', Endpoints.MEDIA)
      .setPayload(RegisterMediaRequest)
      .addSuccess(MediaRegistrationResponse)
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
  .add(PilotProductGroup)
  .add(MediaGroup) {}
