// src/infrastructure/persistence/mongodb/pilot-product.repository.ts

import { Effect, Layer, Option, pipe } from "effect"
import type { Db, Collection, Filter, OptionalUnlessRequiredId } from "mongodb"
import type { PilotProductRepository } from "../../../ports/driven"
import { PilotProductRepository as PilotProductRepositoryTag, PersistenceError } from "../../../ports/driven"
import { toDocument, fromDocument, type PilotProductDocument } from "./mappers"
import { MongoDatabase } from "./mongo-database"

// ============================================
// MONGODB PILOT PRODUCT REPOSITORY
// ============================================

const COLLECTION_NAME = "pilot_products"

// Type-safe collection with string _id
type ProductCollection = Collection<PilotProductDocument>
type ProductFilter = Filter<PilotProductDocument>
type ProductInsert = OptionalUnlessRequiredId<PilotProductDocument>

export const makeMongodbPilotProductRepository = (db: Db): PilotProductRepository => {
  const collection: ProductCollection = db.collection(COLLECTION_NAME)

  return {
    save: (product) =>
      pipe(
        Effect.tryPromise({
          try: async () => {
            const doc = toDocument(product)
            // _id is required in our schema, cast to satisfy MongoDB's OptionalUnlessRequiredId
            await collection.insertOne(doc as ProductInsert)
            return product
          },
          catch: (error) => new PersistenceError({ cause: error })
        })
      ),

    findById: (id) =>
      pipe(
        Effect.tryPromise({
          try: async () => {
            const filter: ProductFilter = { _id: id }
            const doc = await collection.findOne(filter)
            return doc ? Option.some(fromDocument(doc)) : Option.none()
          },
          catch: (error) => new PersistenceError({ cause: error })
        })
      ),

    update: (product) =>
      pipe(
        Effect.tryPromise({
          try: async () => {
            const doc = toDocument(product)
            const filter: ProductFilter = { _id: product.id }
            await collection.replaceOne(filter, doc)
            return product
          },
          catch: (error) => new PersistenceError({ cause: error })
        })
      )
  }
}

// Layer that requires MongoDatabase and provides PilotProductRepository
export const MongodbPilotProductRepositoryLive = Layer.effect(
  PilotProductRepositoryTag,
  Effect.map(MongoDatabase, (db) => makeMongodbPilotProductRepository(db))
)
