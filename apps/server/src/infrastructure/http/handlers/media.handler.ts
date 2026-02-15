// src/infrastructure/http/handlers/media.handler.ts
//
// PRODUCTION-READY: Accepts externalUrl from CDN (Cloudinary, S3, etc.)
// Frontend uploads directly to media server, then calls this endpoint with the URL

import { HttpApiBuilder } from '@effect/platform'
import { FullPaths, GroupNames, MaisonAmaneApi } from '@maison-amane/api'
import { gen, logInfo, annotateLogs } from 'effect/Effect'

import { mediaRegistrationHandler, makeRegisterMediaCommand } from '../../../application/media'
import { makeCorrelationId, makeUserId } from '../../../domain/shared'
import { executeWithObservability, generateCommandContext } from '../helpers'
import { toMediaProblemDetail } from '../mappers/media.mapper'

// ============================================
// MEDIA HTTP HANDLER
// ============================================

export const MediaHandlerLive = HttpApiBuilder.group(MaisonAmaneApi, GroupNames.MEDIA, (handlers) =>
  handlers.handle('register', ({ payload }) =>
    gen(function* () {
      const { correlationId, userId, ctx, errorCtx } = yield* generateCommandContext(
        FullPaths.MEDIA
      )

      const command = makeRegisterMediaCommand({
        externalUrl: payload.externalUrl,
        filename: payload.filename,
        mimeType: payload.mimeType,
        fileSize: payload.fileSize,
        tags: payload.tags || [],
        correlationId: makeCorrelationId(correlationId),
        userId: makeUserId(userId),
        timestamp: new Date(),
      })

      const media = yield* executeWithObservability(
        ctx,
        'registerMedia',
        `POST ${FullPaths.MEDIA}`,
        mediaRegistrationHandler(command),
        (error) => toMediaProblemDetail(error, errorCtx)
      )

      yield* logInfo('Media registered successfully')
        .pipe(annotateLogs({ mediaId: media.mediaId, externalUrl: payload.externalUrl }))

      return { mediaId: media.mediaId, imageUrl: media.externalUrl }
    })
  )
)
