// src/domain/media/value-objects/scalar-types.ts

import * as S from 'effect/Schema'

// ============================================
// MEDIA URL (env-aware)
// ============================================

const MEDIA_URL_PATTERN = process.env.NODE_ENV === 'production' ? /^https:\/\/.+/ : /^https?:\/\/.+/

export const MediaUrlSchema = S.String
  .pipe(S.pattern(MEDIA_URL_PATTERN), S.brand('MediaUrl'))
export type MediaUrl = typeof MediaUrlSchema.Type
export const makeMediaUrl = S.decodeUnknownSync(MediaUrlSchema)

// ============================================
// MIME TYPE
// ============================================

export const MimeTypeSchema = S.String
  .pipe(S.pattern(/^image\/(jpeg|png|webp|gif|svg\+xml)$/),
  S.brand('MimeType'))
export type MimeType = typeof MimeTypeSchema.Type
export const makeMimeType = S.decodeUnknownSync(MimeTypeSchema)

// ============================================
// FILE SIZE (bytes, positive integer)
// ============================================

export const FileSizeSchema = S.Number
  .pipe(S.int(), S.positive(), S.brand('FileSize'))
export type FileSize = typeof FileSizeSchema.Type
export const makeFileSize = S.decodeUnknownSync(FileSizeSchema)
