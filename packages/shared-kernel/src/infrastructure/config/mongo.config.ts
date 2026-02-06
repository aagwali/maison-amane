// packages/shared-kernel/src/infrastructure/config/mongo.config.ts

import { Config, Context, Layer } from 'effect'
import { withDefault } from 'effect/Config'
import type { Redacted } from 'effect/Redacted'

// ============================================
// MONGO DATABASE CONFIG
// ============================================

export interface MongoConfigValue {
  readonly uri: Redacted<string>
  readonly database: string
}

export class MongoConfig extends Context.Tag('MongoConfig')<MongoConfig, MongoConfigValue>() {}

export const mongoConfigFromEnv = Config.all({
  uri: Config.redacted('MONGO_URI'),
  database: Config.string('MONGO_DB').pipe(withDefault('maison_amane')),
})

export const MongoConfigLive = Layer.effect(MongoConfig, mongoConfigFromEnv)
