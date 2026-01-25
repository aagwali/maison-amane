// src/infrastructure/http/handlers/pilot-product.handler.ts

import { Effect } from 'effect'

import { HttpApiBuilder } from '@effect/platform'
import { FullPaths, GroupNames, MaisonAmaneApi } from '@maison-amane/api'

import {
  handlePilotProductCreation,
  MakePilotProductCreationCommand,
} from '../../../application/pilot'
import { MakeCorrelationId, MakeUserId } from '../../../domain/shared'
import { IdGenerator } from '../../../ports/driven'
import { withObservability } from '../../services'
import {
  toProblemDetail,
  toResponse,
  toUnvalidatedProductData,
} from '../mappers'

// ============================================
// PILOT PRODUCT HTTP HANDLER
// ============================================

export const PilotProductHandlerLive = HttpApiBuilder.group(
  MaisonAmaneApi,
  GroupNames.PILOT_PRODUCT,
  (handlers) =>
    handlers.handle('create', ({ payload }) =>
      Effect.gen(function* () {
        const idGen = yield* IdGenerator
        const correlationId = yield* idGen.generateCorrelationId()
        const userId = 'system' // TODO: Extract from auth context
        const ctx = { correlationId, userId, startTime: new Date() }
        const errorCtx = { correlationId, instance: FullPaths.PILOT_PRODUCT }

        const command = MakePilotProductCreationCommand({
          data: toUnvalidatedProductData(payload),
          correlationId: MakeCorrelationId(correlationId),
          userId: MakeUserId(userId),
          timestamp: new Date(),
        })

        const product = yield* withObservability(
          ctx,
          'createPilotProduct',
          `POST ${FullPaths.PILOT_PRODUCT}`,
          handlePilotProductCreation(command)
        ).pipe(Effect.mapError((error) => toProblemDetail(error, errorCtx)))

        yield* Effect.logInfo('Pilot product created successfully').pipe(
          Effect.annotateLogs({ productId: product.id })
        )

        return toResponse(product)
      })
    )
)
