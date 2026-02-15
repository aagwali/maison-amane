// src/infrastructure/persistence/mongodb/media.repository.ts

import type { Collection, Db } from 'mongodb'

import {
  MediaRepository as MediaRepositoryTag,
  type MediaRepositoryService,
} from '../../../ports/driven'
import { MediaNotFoundError } from '../../../domain/media'

import { mediaFromDocument, type MediaDocument, mediaToDocument } from './mappers'
import {
  findDocumentById,
  getDocumentById,
  insertDocument,
  replaceDocument,
  tryMongoOperation,
} from './base-repository'
import { createRepositoryLayer } from './repository-layer-factory'

// ============================================
// MONGODB MEDIA REPOSITORY
// ============================================

const COLLECTION_NAME = 'media'

export const createMongodbMediaRepository = (db: Db): MediaRepositoryService => {
  const collection: Collection<MediaDocument> = db.collection(COLLECTION_NAME)

  return {
    save: (media) => insertDocument(collection, mediaToDocument(media), media),

    update: (media) => replaceDocument(collection, media.mediaId, mediaToDocument(media), media),

    findById: (id) => findDocumentById(collection, id, mediaFromDocument),

    getById: (id) =>
      getDocumentById(
        collection,
        id,
        mediaFromDocument,
        (mediaId) => new MediaNotFoundError({ mediaId })
      ),

    findByExternalUrls: (urls) =>
      tryMongoOperation(async () => {
        const docs = await collection.find({ externalUrl: { $in: [...urls] } }).toArray()
        return docs.map((doc) => mediaFromDocument(doc as MediaDocument))
      }),
  }
}

export const MongodbMediaRepositoryLive = createRepositoryLayer(
  MediaRepositoryTag,
  createMongodbMediaRepository
)
