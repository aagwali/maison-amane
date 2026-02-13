// src/infrastructure/persistence/mongodb/base-repository.ts

import type { Collection, Document } from 'mongodb'
import { tryPromise, type Effect } from 'effect/Effect'
import type { Option as OptionType } from 'effect/Option'
import { Effect as EffectModule, Option } from 'effect'

import { PersistenceError } from '../../../ports/driven'

// ============================================
// GENERIC MONGODB HELPERS
// Reusable helpers for common repository operations
// ============================================

/**
 * Wraps a MongoDB operation in Effect with automatic PersistenceError mapping
 */
export const tryMongoOperation = <A>(operation: () => Promise<A>): Effect<A, PersistenceError> =>
  tryPromise({
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
): Effect<TEntity, PersistenceError> =>
  tryMongoOperation(async () => {
    await collection.updateOne({ _id: id } as any, { $set: document }, { upsert: true })
    return domainEntity
  })

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
): Effect<TEntity, PersistenceError> =>
  tryMongoOperation(async () => {
    await collection.insertOne(document as any)
    return domainEntity
  })

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
): Effect<TEntity, PersistenceError> =>
  tryMongoOperation(async () => {
    await collection.replaceOne({ _id: id } as any, document)
    return domainEntity
  })

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
): Effect<OptionType<TEntity>, PersistenceError> =>
  tryMongoOperation(async () => {
    const doc = await collection.findOne({ _id: id } as any)
    return doc ? Option.some(fromDocument(doc as TDocument)) : Option.none()
  })

/**
 * Generic getById operation for MongoDB
 * Returns TEntity or fails with domain-specific NotFoundError
 *
 * Differs from findDocumentById:
 * - Returns TEntity directly (not Option<TEntity>)
 * - Fails with provided notFoundError if document doesn't exist
 * - Use when entity MUST exist (updates, deletions)
 *
 * @param collection MongoDB collection
 * @param id Document ID to find
 * @param fromDocument Mapper function from MongoDB document to domain entity
 * @param notFoundError Factory function creating domain-specific error
 */
export const getDocumentById = <
  TDocument extends Document,
  TEntity,
  TError extends { readonly _tag: string },
>(
  collection: Collection<TDocument>,
  id: string,
  fromDocument: (doc: TDocument) => TEntity,
  notFoundError: (id: string) => TError
): Effect<TEntity, PersistenceError | TError> =>
  findDocumentById(collection, id, fromDocument)
    .pipe(EffectModule.flatMap(
      Option.match({
        onNone: () => EffectModule.fail(notFoundError(id)),
        onSome: (entity) => EffectModule.succeed(entity),
      })
    ))
