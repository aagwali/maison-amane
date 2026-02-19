// src/infrastructure/persistence/mongodb/mongo-database.ts

import { Context, Data, Layer, Redacted } from 'effect'
import { gen, acquireRelease, tryPromise, promise, tap, logInfo } from 'effect/Effect'
import { Db, MongoClient } from 'mongodb'
import { MongoConfig, MongoConfigLive } from '@maison-amane/shared-kernel/config'

// Re-export for convenience
export { MongoConfig, MongoConfigLive }

// ============================================
// MONGO DATABASE SERVICE
// ============================================

export class MongoDatabase extends Context.Tag('MongoDatabase')<MongoDatabase, Db>() {}

export class MongoDatabaseError extends Data.TaggedError('MongoDatabaseError')<{
  readonly cause: unknown
}> {}

// ============================================
// MONGO DATABASE LAYER
// ============================================

export const MongoDatabaseLive = Layer.scoped(
  MongoDatabase,
  gen(function* () {
    const config = yield* MongoConfig
    const uri = Redacted.value(config.uri)

    const { client: _client, db } = yield* acquireRelease(
      tryPromise({
        try: async () => {
          const mongoClient = new MongoClient(uri, {
            serverSelectionTimeoutMS: 5_000,
          })
          mongoClient.on('error', () => {
            // Prevent unhandled error events from crashing the process
          })
          await mongoClient.connect()
          const db = mongoClient.db(config.database)
          await db.command({ ping: 1 })
          return { client: mongoClient, db }
        },
        catch: (error) => new MongoDatabaseError({ cause: error }),
      }),
      ({ client: mongoClient }) =>
        promise(() => mongoClient.close())
          .pipe(tap(() => logInfo('MongoDB connection closed')))
    )

    yield* logInfo(`MongoDB connected to database: ${config.database}`)
    return db
  })
)
  .pipe(Layer.provide(MongoConfigLive))
