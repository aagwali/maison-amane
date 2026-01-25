// src/infrastructure/persistence/mongodb/mongo-database.ts

import { Context, Data, Effect, Layer, Redacted } from 'effect'
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
  Effect.gen(function* () {
    const config = yield* MongoConfig
    const uri = Redacted.value(config.uri)

    const { client: _client, db } = yield* Effect.acquireRelease(
      Effect.tryPromise({
        try: async () => {
          const mongoClient = new MongoClient(uri)
          await mongoClient.connect()
          return { client: mongoClient, db: mongoClient.db(config.database) }
        },
        catch: (error) => new MongoDatabaseError({ cause: error }),
      }),
      ({ client: mongoClient }) =>
        Effect.promise(() => mongoClient.close()).pipe(
          Effect.tap(() => Effect.logInfo('MongoDB connection closed'))
        )
    )

    yield* Effect.logInfo(`MongoDB connected to database: ${config.database}`)
    return db
  })
).pipe(Layer.provide(MongoConfigLive))
