// src/infrastructure/persistence/mongodb/pilot-product.repository.ts

import { Effect, Layer, Option, pipe } from "effect"
import type { PilotProductRepository } from "../../../ports/driven"
import { PilotProductRepository as PilotProductRepositoryTag } from "../../../ports/driven"
import { PersistenceError } from "../../../domain/pilot"
import { toDocument, fromDocument } from "./mappers"

// ============================================
// MONGODB PILOT PRODUCT REPOSITORY
// ============================================

export const makeMongodbPilotProductRepository = (
  db: any // MongoDB Db instance
): PilotProductRepository => {
  const collection = db.collection("pilot_products")

  return {
    save: (product) =>
      pipe(
        Effect.tryPromise({
          try: async () => {
            const doc = toDocument(product)
            await collection.insertOne(doc)
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
            return doc ? Option.some(fromDocument(doc)) : Option.none()
          },
          catch: (error) => PersistenceError.create(error)
        })
      ),

    update: (product) =>
      pipe(
        Effect.tryPromise({
          try: async () => {
            const doc = toDocument(product)
            await collection.replaceOne({ _id: product.id }, doc)
            return product
          },
          catch: (error) => PersistenceError.create(error)
        })
      )
  }
}

// Layer factory (requires db instance at runtime)
export const makeMongodbPilotProductRepositoryLayer = (db: any) =>
  Layer.succeed(PilotProductRepositoryTag, makeMongodbPilotProductRepository(db))
