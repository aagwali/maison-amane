// src/application/media/handlers/register-media.handler.ts

import { type Effect, gen } from 'effect/Effect'

import { makeMedia, MediaStatus, type Media } from '../../../domain/media'
import { makeMimeType, makeFileSize, makeMediaUrl } from '../../../domain/media'
import { IdGenerator, MediaRepository, Clock, type PersistenceError } from '../../../ports/driven'
import type { RegisterMediaCommand } from '../commands/register-media.command'

// ============================================
// REGISTER MEDIA HANDLER
// ============================================
// Registers a media file already uploaded to CDN
// The media starts in PENDING status and will be confirmed
// when referenced in a product creation/update event

export type MediaRegistrationError = PersistenceError

export const mediaRegistrationHandler = (
  command: RegisterMediaCommand
): Effect<Media, MediaRegistrationError, IdGenerator | MediaRepository | Clock> =>
  gen(function* () {
    const idGen = yield* IdGenerator
    const repo = yield* MediaRepository
    const clock = yield* Clock

    const mediaId = yield* idGen.generateMediaId()
    const now = yield* clock.now()

    const media = makeMedia({
      mediaId,
      externalUrl: makeMediaUrl(command.externalUrl),
      mimeType: makeMimeType(command.mimeType),
      fileSize: makeFileSize(command.fileSize),
      status: MediaStatus.PENDING,
      uploadedAt: now,
      tags: command.tags,
    })

    return yield* repo.save(media)
  })
