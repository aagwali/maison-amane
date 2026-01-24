// src/main.ts
// Catalog Projection Consumer - maintains read model for alternative UI

import { Config, Effect, Layer, Logger, LogLevel } from 'effect'

import { NodeRuntime } from '@effect/platform-node'
import {
  catalogProjectionHandler,
  JsonLogger,
  MongoDatabaseLive,
  MongodbCatalogProductRepositoryLive,
  PrettyLogger,
  RabbitMQConfigLive,
  RabbitMQConnectionLayer,
  setupConsumerQueue,
  setupTopology,
  startConsumer,
} from '@maison-amane/server'

// ============================================
// CONSUMER IDENTITY
// ============================================

const CONSUMER_NAME = "catalog-projection"

// ============================================
// CONSUMER CONFIGURATION
// ============================================

const ConsumerConfig = Config.all({
  nodeEnv: Config.literal("development", "production", "test")("NODE_ENV").pipe(
    Config.withDefault("development")
  ),
  logLevel: Config.literal("debug", "info", "warn", "error")("LOG_LEVEL").pipe(
    Config.withDefault("info")
  ),
})

// ============================================
// LOG LEVEL MAPPING
// ============================================

const logLevelMap = {
  debug: LogLevel.Debug,
  info: LogLevel.Info,
  warn: LogLevel.Warning,
  error: LogLevel.Error,
} as const

// ============================================
// MAIN PROGRAM
// ============================================

const program = Effect.gen(function* () {
  const { nodeEnv, logLevel } = yield* ConsumerConfig

  const isDev = nodeEnv !== "production"
  const minLevel = Logger.minimumLogLevel(logLevelMap[logLevel])

  const LoggerLive = isDev
    ? Layer.mergeAll(Logger.replace(Logger.defaultLogger, PrettyLogger), minLevel)
    : Layer.mergeAll(Logger.replace(Logger.defaultLogger, JsonLogger), minLevel)

  const RabbitMQLayer = Layer.provideMerge(
    RabbitMQConnectionLayer,
    RabbitMQConfigLive
  )

  // MongoDB repository layer with its database dependency
  const CatalogProductRepositoryLayer = MongodbCatalogProductRepositoryLive.pipe(
    Layer.provide(MongoDatabaseLive)
  )

  yield* Effect.provide(
    Effect.gen(function* () {
      yield* Effect.logInfo(`Starting ${CONSUMER_NAME} consumer...`)

      // Setup shared exchanges
      yield* setupTopology

      // Setup this consumer's queues
      yield* setupConsumerQueue(CONSUMER_NAME)

      yield* Effect.logInfo("RabbitMQ topology initialized")

      // Start catalog projection consumer
      yield* startConsumer(CONSUMER_NAME, catalogProjectionHandler)

      yield* Effect.logInfo(`${CONSUMER_NAME} consumer ready - waiting for PilotProductPublished events...`)

      yield* Effect.never
    }),
    Layer.mergeAll(RabbitMQLayer, LoggerLive, CatalogProductRepositoryLayer)
  )
})

// ============================================
// RUN
// ============================================

NodeRuntime.runMain(program)
