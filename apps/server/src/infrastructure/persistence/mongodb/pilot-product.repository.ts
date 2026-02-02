// src/infrastructure/persistence/mongodb/pilot-product.repository.ts

import type { Collection, Db } from 'mongodb'

import {
  PilotProductRepository as PilotProductRepositoryTag,
  type PilotProductRepositoryService,
} from '../../../ports/driven'

import { fromDocument, type PilotProductDocument, toDocument } from './mappers'
import { findDocumentById, insertDocument, replaceDocument } from './base-repository'
import { createRepositoryLayer } from './repository-layer-factory'

// ============================================
// MONGODB PILOT PRODUCT REPOSITORY
// ============================================

const COLLECTION_NAME = 'pilot_products'

export const createMongodbPilotProductRepository = (db: Db): PilotProductRepositoryService => {
  // Type-safe collection with PilotProductDocument schema
  const collection: Collection<PilotProductDocument> = db.collection(COLLECTION_NAME)

  return {
    save: (product) => {
      const doc = toDocument(product)
      return insertDocument(collection, doc, product)
    },

    findById: (id) => findDocumentById(collection, id, fromDocument),

    update: (product) => {
      const doc = toDocument(product)
      return replaceDocument(collection, product.id, doc, product)
    },
  }
}

// Layer that requires MongoDatabase and provides PilotProductRepository
export const MongodbPilotProductRepositoryLive = createRepositoryLayer(
  PilotProductRepositoryTag,
  createMongodbPilotProductRepository
)
