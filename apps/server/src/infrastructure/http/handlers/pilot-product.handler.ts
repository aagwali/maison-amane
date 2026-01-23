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
import { withObservability } from '../../services'

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
          const userId = 'system' // TODO: Extract from auth context
          const ctx = { correlationId, userId, startTime: new Date() }

          const command = MakePilotProductCreationCommand({
            _tag: 'CreatePilotProductCommand',
            data: toUnvalidatedProductData(payload),
            correlationId: MakeCorrelationId(correlationId),
            userId: MakeUserId(userId),
            timestamp: new Date(),
          })

          const product = yield* withObservability(
            ctx,
            "createPilotProduct",
            "POST /api/pilot-product",
            handlePilotProductCreation(command)
          )

          yield* Effect.logInfo("Pilot product created successfully").pipe(
            Effect.annotateLogs({ productId: product.id })
          )

          return toResponse(product)
        }),
        Effect.mapError(toApiError)
      )
    )
)
