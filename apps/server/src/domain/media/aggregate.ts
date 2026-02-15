// src/domain/media/aggregate.ts

import * as S from 'effect/Schema'
import { Data } from 'effect'
import { type Effect, fail, succeed } from 'effect/Effect'

import { MediaIdSchema } from './value-objects/ids'
import { MediaUrlSchema, MimeTypeSchema, FileSizeSchema } from './value-objects/scalar-types'
import { MediaStatus, MediaStatusSchema } from './enums'
import { MediaAlreadyConfirmedError } from './errors'

// ============================================
// MEDIA AGGREGATE
// ============================================

export const MediaSchema = S.TaggedStruct('Media', {
  mediaId: MediaIdSchema,
  externalUrl: MediaUrlSchema,
  mimeType: MimeTypeSchema,
  fileSize: FileSizeSchema,
  status: MediaStatusSchema,
  uploadedAt: S.Date,
  tags: S.Array(S.String),
})

export type Media = typeof MediaSchema.Type

export const makeMedia = (params: Omit<Media, '_tag'>): Media =>
  Data.case<Media>()({ _tag: 'Media', ...params })

// ============================================
// AGGREGATE METHODS
// ============================================

export const confirmMedia = (media: Media): Effect<Media, MediaAlreadyConfirmedError> => {
  if (media.status === MediaStatus.CONFIRMED) {
    return fail(new MediaAlreadyConfirmedError({ mediaId: media.mediaId }))
  }
  return succeed(makeMedia({ ...media, status: MediaStatus.CONFIRMED }))
}
