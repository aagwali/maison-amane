// src/infrastructure/persistence/mongodb/mongo-database.ts

import { Config, Context, Effect, Layer, Redacted } from "effect"
import { MongoClient, Db } from "mongodb"

// ============================================
// MONGO DATABASE CONFIG
// ============================================

export class MongoConfig extends Context.Tag("MongoConfig")<
  MongoConfig,
  { readonly uri: Redacted.Redacted<string>; readonly database: string }
>() {}

const mongoConfigFromEnv = Config.all({
  uri: Config.redacted("MONGO_URI"),
  database: Config.string("MONGO_DB")
})

export const MongoConfigLive = Layer.effect(
  MongoConfig,
  mongoConfigFromEnv
)

// ============================================
// MONGO DATABASE SERVICE
// ============================================

export class MongoDatabase extends Context.Tag("MongoDatabase")<
  MongoDatabase,
  Db
>() {}

export class MongoDatabaseError {
  readonly _tag = "MongoDatabaseError"
  constructor(readonly cause: unknown) {}
}

// ============================================
// MONGO DATABASE LAYER
// ============================================

export const MongoDatabaseLive = Layer.scoped(
  MongoDatabase,
  Effect.gen(function* () {
    const config = yield* MongoConfig
    const uri = Redacted.value(config.uri)

    const { client, db } = yield* Effect.acquireRelease(
      Effect.tryPromise({
        try: async () => {
          const mongoClient = new MongoClient(uri)
          await mongoClient.connect()
          return { client: mongoClient, db: mongoClient.db(config.database) }
        },
        catch: (error) => new MongoDatabaseError(error)
      }),
      ({ client: mongoClient }) =>
        Effect.promise(() => mongoClient.close()).pipe(
          Effect.tap(() => Effect.logInfo("MongoDB connection closed"))
        )
    )

    yield* Effect.logInfo(`MongoDB connected to database: ${config.database}`)
    return db
  })
).pipe(Layer.provide(MongoConfigLive))
