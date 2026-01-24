// src/infrastructure/persistence/mongodb/base-repository.ts

import { Effect, Option, pipe } from 'effect'
import { PersistenceError } from '../../../ports/driven'

import type { Collection, Document } from "mongodb"

// ============================================
// GENERIC MONGODB HELPERS
// Reusable helpers for common repository operations
// ============================================

/**
 * Wraps a MongoDB operation in Effect with automatic PersistenceError mapping
 */
export const tryMongoOperation = <A>(
  operation: () => Promise<A>
): Effect.Effect<A, PersistenceError> =>
  Effect.tryPromise({
    try: operation,
    catch: (error) => new PersistenceError({ cause: error }),
  })

/**
 * Generic upsert operation for MongoDB
 * Updates document if exists, inserts if not
 *
 * @param collection MongoDB collection
 * @param id Document ID (matches _id field)
 * @param document Full document to upsert
 * @param domainEntity Original domain entity to return on success
 */
export const upsertDocument = <TDocument extends Document, TEntity>(
  collection: Collection<TDocument>,
  id: string,
  document: TDocument,
  domainEntity: TEntity
): Effect.Effect<TEntity, PersistenceError> =>
  pipe(
    tryMongoOperation(async () => {
      await collection.updateOne(
        { _id: id } as any,
        { $set: document },
        { upsert: true }
      )
      return domainEntity
    })
  )

/**
 * Generic insert operation for MongoDB
 *
 * @param collection MongoDB collection
 * @param document Document to insert
 * @param domainEntity Original domain entity to return on success
 */
export const insertDocument = <TDocument extends Document, TEntity>(
  collection: Collection<TDocument>,
  document: TDocument,
  domainEntity: TEntity
): Effect.Effect<TEntity, PersistenceError> =>
  pipe(
    tryMongoOperation(async () => {
      await collection.insertOne(document as any)
      return domainEntity
    })
  )

/**
 * Generic update operation for MongoDB (replace entire document)
 *
 * @param collection MongoDB collection
 * @param id Document ID (matches _id field)
 * @param document Full document to replace with
 * @param domainEntity Original domain entity to return on success
 */
export const replaceDocument = <TDocument extends Document, TEntity>(
  collection: Collection<TDocument>,
  id: string,
  document: TDocument,
  domainEntity: TEntity
): Effect.Effect<TEntity, PersistenceError> =>
  pipe(
    tryMongoOperation(async () => {
      await collection.replaceOne({ _id: id } as any, document)
      return domainEntity
    })
  )

/**
 * Generic findById operation for MongoDB
 * Returns Option<TEntity> (Some if found, None if not)
 *
 * @param collection MongoDB collection
 * @param id Document ID to find
 * @param fromDocument Mapper function from MongoDB document to domain entity
 */
export const findDocumentById = <TDocument extends Document, TEntity>(
  collection: Collection<TDocument>,
  id: string,
  fromDocument: (doc: TDocument) => TEntity
): Effect.Effect<Option.Option<TEntity>, PersistenceError> =>
  pipe(
    tryMongoOperation(async () => {
      const doc = await collection.findOne({ _id: id } as any)
      return doc ? Option.some(fromDocument(doc as TDocument)) : Option.none()
    })
  )

/**
 * Generic findAll operation for MongoDB
 * Returns array of all documents in collection
 *
 * @param collection MongoDB collection
 * @param fromDocument Mapper function from MongoDB document to domain entity
 * @param filter Optional MongoDB filter (defaults to empty = all documents)
 */
export const findAllDocuments = <TDocument extends Document, TEntity>(
  collection: Collection<TDocument>,
  fromDocument: (doc: TDocument) => TEntity,
  filter: any = {}
): Effect.Effect<readonly TEntity[], PersistenceError> =>
  pipe(
    tryMongoOperation(async () => {
      const docs = await collection.find(filter).toArray()
      return docs.map((doc) => fromDocument(doc as TDocument))
    })
  )
