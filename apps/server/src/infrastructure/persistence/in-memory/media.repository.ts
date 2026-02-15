// src/infrastructure/persistence/in-memory/media.repository.ts

import { Layer, Option } from 'effect'
import { try as trySync } from 'effect/Effect'

import {
  MediaRepository,
  type MediaRepositoryService,
  PersistenceError,
} from '../../../ports/driven'
import { MediaNotFoundError, type Media } from '../../../domain/media'

// ============================================
// IN-MEMORY MEDIA REPOSITORY
// ============================================

export const createInMemoryMediaRepository = (): MediaRepositoryService => {
  const store = new Map<string, Media>()

  return {
    save: (media) =>
      trySync({
        try: () => {
          store.set(media.mediaId, media)
          return media
        },
        catch: (error) => new PersistenceError({ cause: error }),
      }),

    findById: (id) =>
      trySync({
        try: () => {
          const media = store.get(id)
          return media ? Option.some(media) : Option.none()
        },
        catch: (error) => new PersistenceError({ cause: error }),
      }),

    getById: (id) =>
      trySync({
        try: () => {
          const media = store.get(id)
          if (!media) {
            throw new MediaNotFoundError({ mediaId: id })
          }
          return media
        },
        catch: (error) => {
          // Preserve TaggedError, wrap others in PersistenceError
          if (error && typeof error === 'object' && '_tag' in error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return error as any
          }
          return new PersistenceError({ cause: error })
        },
      }),

    update: (media) =>
      trySync({
        try: () => {
          store.set(media.mediaId, media)
          return media
        },
        catch: (error) => new PersistenceError({ cause: error }),
      }),

    findByExternalUrls: (urls) =>
      trySync({
        try: () => {
          const urlSet = new Set(urls)
          const results: Media[] = []
          for (const media of store.values()) {
            if (urlSet.has(media.externalUrl)) {
              results.push(media)
            }
          }
          return results
        },
        catch: (error) => new PersistenceError({ cause: error }),
      }),
  }
}

export const InMemoryMediaRepositoryLive = Layer.succeed(
  MediaRepository,
  createInMemoryMediaRepository()
)
