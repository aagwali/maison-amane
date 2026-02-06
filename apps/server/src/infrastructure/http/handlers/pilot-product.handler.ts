// src/infrastructure/http/handlers/pilot-product.handler.ts

import { HttpApiBuilder } from '@effect/platform'
import { FullPaths, GroupNames, MaisonAmaneApi } from '@maison-amane/api'
import { logInfo, gen, annotateLogs } from 'effect/Effect'

import {
  handlePilotProductCreation,
  handlePilotProductUpdate,
  makePilotProductCreationCommand,
  makePilotProductUpdateCommand,
} from '../../../application/pilot'
import { makeCorrelationId, makeUserId } from '../../../domain/shared'
import { makeProductId } from '../../../domain/pilot'
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
        gen(function* () {
          const { correlationId, userId, ctx, errorCtx } = yield* generateCommandContext(
            FullPaths.PILOT_PRODUCT
          )

          const command = makePilotProductCreationCommand({
            data: toUnvalidatedProductData(payload),
            correlationId: makeCorrelationId(correlationId),
            userId: makeUserId(userId),
            timestamp: new Date(),
          })

          const product = yield* executeWithObservability(
            ctx,
            'createPilotProduct',
            `POST ${FullPaths.PILOT_PRODUCT}`,
            handlePilotProductCreation(command),
            (error) => toProblemDetail(error, errorCtx)
          )

          yield* logInfo('Pilot product created successfully').pipe(
            annotateLogs({ productId: product.id })
          )

          return toResponse(product)
        })
      )
      .handle('update', ({ path, payload }) =>
        gen(function* () {
          const { correlationId, userId, ctx, errorCtx } = yield* generateCommandContext(
            `${FullPaths.PILOT_PRODUCT}/${path.id}`
          )

          const command = makePilotProductUpdateCommand({
            productId: makeProductId(path.id),
            data: toUnvalidatedUpdateData(payload),
            correlationId: makeCorrelationId(correlationId),
            userId: makeUserId(userId),
            timestamp: new Date(),
          })

          const product = yield* executeWithObservability(
            ctx,
            'updatePilotProduct',
            `PUT ${FullPaths.PILOT_PRODUCT}/${path.id}`,
            handlePilotProductUpdate(command),
            (error) => toUpdateProblemDetail(error, errorCtx)
          )

          yield* logInfo('Pilot product updated successfully').pipe(
            annotateLogs({ productId: product.id })
          )

          return toResponse(product)
        })
      )
)
