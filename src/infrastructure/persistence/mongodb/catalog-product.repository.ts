// src/infrastructure/persistence/mongodb/catalog-product.repository.ts

import { Effect, Layer, Option, pipe } from "effect"
import type { CatalogProductRepository } from "../../../ports/driven"
import { CatalogProductRepository as CatalogProductRepositoryTag } from "../../../ports/driven"
import { PersistenceError } from "../../../domain/pilot"
import { catalogToDocument, catalogFromDocument } from "./mappers/catalog-product.mapper"

// ============================================
// MONGODB CATALOG PRODUCT REPOSITORY
// ============================================

export const makeMongodbCatalogProductRepository = (
  db: any // MongoDB Db instance
): CatalogProductRepository => {
  const collection = db.collection("catalog_products")

  return {
    upsert: (product) =>
      pipe(
        Effect.tryPromise({
          try: async () => {
            const doc = catalogToDocument(product)
            await collection.updateOne(
              { _id: doc._id },
              { $set: doc },
              { upsert: true }
            )
            return product
          },
          catch: (error) => PersistenceError.create(error)
        })
      ),

    findById: (id) =>
      pipe(
        Effect.tryPromise({
          try: async () => {
            const doc = await collection.findOne({ _id: id })
            return doc ? Option.some(catalogFromDocument(doc)) : Option.none()
          },
          catch: (error) => PersistenceError.create(error)
        })
      ),

    findAll: () =>
      pipe(
        Effect.tryPromise({
          try: async () => {
            const docs = await collection.find({}).toArray()
            return docs.map(catalogFromDocument)
          },
          catch: (error) => PersistenceError.create(error)
        })
      )
  }
}

// Layer factory (requires db instance at runtime)
export const makeMongodbCatalogProductRepositoryLayer = (db: any) =>
  Layer.succeed(CatalogProductRepositoryTag, makeMongodbCatalogProductRepository(db))
