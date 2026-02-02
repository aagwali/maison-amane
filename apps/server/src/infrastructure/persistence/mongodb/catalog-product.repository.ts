// src/infrastructure/persistence/mongodb/catalog-product.repository.ts

import type { Collection, Db } from 'mongodb'

import { CatalogProductRepository as CatalogProductRepositoryTag } from '../../../ports/driven'
import type { CatalogProductRepositoryService } from '../../../ports/driven'

import {
  catalogFromDocument,
  catalogToDocument,
  type CatalogProductDocument,
} from './mappers/catalog-product.mapper'
import { findAllDocuments, findDocumentById, upsertDocument } from './base-repository'
import { createRepositoryLayer } from './repository-layer-factory'

// ============================================
// MONGODB CATALOG PRODUCT REPOSITORY
// ============================================

export const createMongodbCatalogProductRepository = (db: Db): CatalogProductRepositoryService => {
  const collection: Collection<CatalogProductDocument> = db.collection('catalog_products')

  return {
    upsert: (product) => {
      const doc = catalogToDocument(product)
      return upsertDocument(collection, doc._id, doc, product)
    },

    findById: (id) => findDocumentById(collection, id, catalogFromDocument),

    findAll: () => findAllDocuments(collection, catalogFromDocument),
  }
}

// Live layer using MongoDatabase service
export const MongodbCatalogProductRepositoryLive = createRepositoryLayer(
  CatalogProductRepositoryTag,
  createMongodbCatalogProductRepository
)
