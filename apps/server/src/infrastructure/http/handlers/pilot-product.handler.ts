// src/infrastructure/http/handlers/pilot-product.handler.ts

import { HttpApiBuilder } from '@effect/platform'
import { Effect, pipe } from 'effect'
import { MaisonAmaneApi } from '@maison-amane/api'
import {
  MakePilotProductCreationCommand,
  handlePilotProductCreation,
} from '../../../application/pilot'
import { MakeCorrelationId, MakeUserId } from '../../../domain/shared'
import { toUnvalidatedProductData, toResponse, toApiError } from '../mappers'
import { IdGenerator } from '../../../ports/driven'

// ============================================
// PILOT PRODUCT HTTP HANDLER
// ============================================

export const PilotProductHandlerLive = HttpApiBuilder.group(
  MaisonAmaneApi,
  'pilot-product',
  (handlers) =>
    handlers.handle('create', ({ payload }) =>
      pipe(
        Effect.gen(function* () {
          const idGen = yield* IdGenerator
          const correlationId = yield* idGen.generateCorrelationId()

          const command = MakePilotProductCreationCommand({
            _tag: 'CreatePilotProductCommand',
            data: toUnvalidatedProductData(payload),
            correlationId: MakeCorrelationId(correlationId),
            userId: MakeUserId('system'), // TODO: Extract from auth context
            timestamp: new Date(),
          })

          const product = yield* handlePilotProductCreation(command)

          return toResponse(product)
        }),
        Effect.mapError(toApiError)
      )
    )
)
