// src/infrastructure/persistence/mongodb/catalog-product.repository.ts

import { Effect, Layer } from 'effect'

import { CatalogProductRepository as CatalogProductRepositoryTag } from '../../../ports/driven'
import {
  catalogFromDocument,
  catalogToDocument,
} from './mappers/catalog-product.mapper'
import { MongoDatabase } from './mongo-database'
import {
  findAllDocuments,
  findDocumentById,
  upsertDocument,
} from './base-repository'

import type { CatalogProductRepositoryService } from "../../../ports/driven"

// ============================================
// MONGODB CATALOG PRODUCT REPOSITORY
// ============================================

export const makeMongodbCatalogProductRepository = (
  db: any // MongoDB Db instance
): CatalogProductRepositoryService => {
  const collection = db.collection("catalog_products")

  return {
    upsert: (product) => {
      const doc = catalogToDocument(product)
      return upsertDocument(collection, doc._id, doc, product)
    },

    findById: (id) => findDocumentById(collection, id, catalogFromDocument),

    findAll: () => findAllDocuments(collection, catalogFromDocument),
  }
}

// Layer factory (requires db instance at runtime)
export const makeMongodbCatalogProductRepositoryLayer = (db: any) =>
  Layer.succeed(CatalogProductRepositoryTag, makeMongodbCatalogProductRepository(db))

// Live layer using MongoDatabase service
export const MongodbCatalogProductRepositoryLive = Layer.effect(
  CatalogProductRepositoryTag,
  Effect.map(MongoDatabase, (db) => makeMongodbCatalogProductRepository(db))
)
