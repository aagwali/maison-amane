// src/ports/driven/repositories/media.repository.ts

import { Context } from 'effect'
import type { Effect } from 'effect/Effect'
import type { Option } from 'effect/Option'

import type { Media, MediaId, MediaNotFoundError } from '../../../domain/media'

import type { PersistenceError } from './errors'

// ============================================
// MEDIA REPOSITORY
// ============================================

export interface MediaRepositoryService {
  readonly save: (media: Media) => Effect<Media, PersistenceError>

  readonly update: (media: Media) => Effect<Media, PersistenceError>

  readonly getById: (id: MediaId) => Effect<Media, PersistenceError | MediaNotFoundError>

  readonly findById: (id: MediaId) => Effect<Option<Media>, PersistenceError>

  readonly findByExternalUrls: (
    urls: readonly string[]
  ) => Effect<readonly Media[], PersistenceError>
}

export class MediaRepository extends Context.Tag('MediaRepository')<
  MediaRepository,
  MediaRepositoryService
>() {}
