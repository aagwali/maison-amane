// src/application/media/handlers/confirm-media.handler.ts

import { type Effect, gen, catchTag, succeed } from 'effect/Effect'

import { confirmMedia, MediaStatus } from '../../../domain/media'
import { MediaRepository, type PersistenceError } from '../../../ports/driven'

// ============================================
// CONFIRM MEDIA HANDLER
// ============================================

export const confirmMediaByUrls = (
  urls: readonly string[]
): Effect<void, PersistenceError, MediaRepository> =>
  gen(function* () {
    if (urls.length === 0) return

    const repo = yield* MediaRepository
    const mediaList = yield* repo.findByExternalUrls(urls)

    for (const media of mediaList) {
      if (media.status === MediaStatus.PENDING) {
        // We ignore MediaAlreadyConfirmedError (shouldn't happen with the guard, but handle it for safety)
        const confirmed = yield* confirmMedia(media)
          .pipe(catchTag('MediaAlreadyConfirmedError', () => succeed(media)))
        yield* repo.update(confirmed)
      }
      // CONFIRMED → no-op (idempotent)
    }
  })
