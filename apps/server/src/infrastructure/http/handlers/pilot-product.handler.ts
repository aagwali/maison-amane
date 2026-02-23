// src/infrastructure/http/handlers/pilot-product.handler.ts

import { HttpApiBuilder } from '@effect/platform'
import { FullPaths, GroupNames, MaisonAmaneApi } from '@maison-amane/api'
import { logInfo, gen, annotateLogs } from 'effect/Effect'

import {
  pilotProductCreationHandler,
  pilotProductUpdateHandler,
  getPilotProductHandler,
  listPilotProductsHandler,
  makePilotProductCreationCommand,
  makePilotProductUpdateCommand,
  makeGetPilotProductQuery,
  makeListPilotProductsQuery,
} from '../../../application/pilot'
import { makeCorrelationId, makeUserId } from '../../../domain/shared'
import { makeProductId } from '../../../domain/pilot'
import {
  toProblemDetail,
  toResponse,
  toUnvalidatedProductData,
  toUnvalidatedUpdateData,
  toUpdateProblemDetail,
  toQueryProblemDetail,
  toListProblemDetail,
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
      .handle('listAll', () =>
        gen(function* () {
          const { ctx, errorCtx } = yield* generateCommandContext(FullPaths.PILOT_PRODUCT)

          const query = makeListPilotProductsQuery()

          const products = yield* executeWithObservability(
            ctx,
            'listPilotProducts',
            `GET ${FullPaths.PILOT_PRODUCT}`,
            listPilotProductsHandler(query),
            (error) => toListProblemDetail(error, errorCtx)
          )

          yield* logInfo('Pilot products listed successfully')

          return products.map(toResponse)
        })
      )
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
            pilotProductCreationHandler(command),
            (error) => toProblemDetail(error, errorCtx)
          )

          yield* logInfo('Pilot product created successfully')
            .pipe(annotateLogs({ productId: product.id }))

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
            pilotProductUpdateHandler(command),
            (error) => toUpdateProblemDetail(error, errorCtx)
          )

          yield* logInfo('Pilot product updated successfully')
            .pipe(annotateLogs({ productId: product.id }))

          return toResponse(product)
        })
      )
      .handle('getById', ({ path }) =>
        gen(function* () {
          const { ctx, errorCtx } = yield* generateCommandContext(
            `${FullPaths.PILOT_PRODUCT}/${path.id}`
          )

          const query = makeGetPilotProductQuery(makeProductId(path.id))

          const product = yield* executeWithObservability(
            ctx,
            'getPilotProduct',
            `GET ${FullPaths.PILOT_PRODUCT}/${path.id}`,
            getPilotProductHandler(query),
            (error) => toQueryProblemDetail(error, errorCtx)
          )

          yield* logInfo('Pilot product retrieved successfully')
            .pipe(annotateLogs({ productId: product.id }))

          return toResponse(product)
        })
      )
)
