// src/infrastructure/persistence/mongodb/mappers/media.mapper.ts

import type { Media } from '../../../../domain/media'
import {
  makeMedia,
  makeMediaId,
  makeMediaUrl,
  makeMimeType,
  makeFileSize,
} from '../../../../domain/media'

// ============================================
// MONGODB DOCUMENT TYPE
// ============================================

export type MediaDocument = {
  _id: string
  externalUrl: string
  mimeType: string
  fileSize: number
  status: string
  uploadedAt: Date
  tags: readonly string[]
}

// ============================================
// MAPPERS
// ============================================

export const mediaToDocument = (media: Media): MediaDocument => ({
  _id: media.mediaId,
  externalUrl: media.externalUrl,
  mimeType: media.mimeType,
  fileSize: media.fileSize,
  status: media.status,
  uploadedAt: media.uploadedAt,
  tags: media.tags,
})

export const mediaFromDocument = (doc: MediaDocument): Media =>
  makeMedia({
    mediaId: makeMediaId(doc._id),
    externalUrl: makeMediaUrl(doc.externalUrl),
    mimeType: makeMimeType(doc.mimeType),
    fileSize: makeFileSize(doc.fileSize),
    status: doc.status as any, // MediaStatus
    uploadedAt: doc.uploadedAt,
    tags: doc.tags,
  })
