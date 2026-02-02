// src/infrastructure/http/handlers/pilot-product.handler.ts

import { Effect } from 'effect'
import { HttpApiBuilder } from '@effect/platform'
import { FullPaths, GroupNames, MaisonAmaneApi } from '@maison-amane/api'

import {
  handlePilotProductCreation,
  handlePilotProductUpdate,
  MakePilotProductCreationCommand,
  MakePilotProductUpdateCommand,
} from '../../../application/pilot'
import { MakeCorrelationId, MakeUserId } from '../../../domain/shared'
import { MakeProductId } from '../../../domain/pilot'
import {
  toProblemDetail,
  toResponse,
  toUnvalidatedProductData,
  toUnvalidatedUpdateData,
  toUpdateProblemDetail,
} from '../mappers'
import { executeWithObservability, generateCommandContext } from '../helpers'

// ============================================
// PILOT PRODUCT HTTP HANDLER
// ============================================

export const PilotProductHandlerLive = HttpApiBuilder.group(
  MaisonAmaneApi,
  GroupNames.PILOT_PRODUCT,
  (handlers) =>
    handlers
      .handle('create', ({ payload }) =>
        Effect.gen(function* () {
          const { correlationId, userId, ctx, errorCtx } = yield* generateCommandContext(
            FullPaths.PILOT_PRODUCT
          )

          const command = MakePilotProductCreationCommand({
            data: toUnvalidatedProductData(payload),
            correlationId: MakeCorrelationId(correlationId),
            userId: MakeUserId(userId),
            timestamp: new Date(),
          })

          const product = yield* executeWithObservability(
            ctx,
            'createPilotProduct',
            `POST ${FullPaths.PILOT_PRODUCT}`,
            handlePilotProductCreation(command),
            (error) => toProblemDetail(error, errorCtx)
          )

          yield* Effect.logInfo('Pilot product created successfully').pipe(
            Effect.annotateLogs({ productId: product.id })
          )

          return toResponse(product)
        })
      )
      .handle('update', ({ path, payload }) =>
        Effect.gen(function* () {
          const { correlationId, userId, ctx, errorCtx } = yield* generateCommandContext(
            `${FullPaths.PILOT_PRODUCT}/${path.id}`
          )

          const command = MakePilotProductUpdateCommand({
            productId: MakeProductId(path.id),
            data: toUnvalidatedUpdateData(payload),
            correlationId: MakeCorrelationId(correlationId),
            userId: MakeUserId(userId),
            timestamp: new Date(),
          })

          const product = yield* executeWithObservability(
            ctx,
            'updatePilotProduct',
            `PUT ${FullPaths.PILOT_PRODUCT}/${path.id}`,
            handlePilotProductUpdate(command),
            (error) => toUpdateProblemDetail(error, errorCtx)
          )

          yield* Effect.logInfo('Pilot product updated successfully').pipe(
            Effect.annotateLogs({ productId: product.id })
          )

          return toResponse(product)
        })
      )
)
