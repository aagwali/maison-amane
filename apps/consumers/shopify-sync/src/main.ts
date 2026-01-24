// src/main.ts
// Shopify Sync Consumer - syncs domain events to Shopify

import { Config, Effect, Layer, Logger, LogLevel } from 'effect'

import { NodeRuntime } from '@effect/platform-node'
import {
  FakeShopifyClientLive,
  JsonLogger,
  MongoDatabaseLive,
  MongodbPilotProductRepositoryLive,
  PrettyLogger,
  RabbitMQConfigLive,
  RabbitMQConnectionLayer,
  setupConsumerQueue,
  setupTopology,
  shopifySyncHandler,
  startConsumer,
} from '@maison-amane/server'

// ============================================
// CONSUMER IDENTITY
// ============================================

const CONSUMER_NAME = "shopify-sync"

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

  // MongoDB repository layer for PilotProduct
  const PilotProductRepositoryLayer = MongodbPilotProductRepositoryLive.pipe(
    Layer.provide(MongoDatabaseLive)
  )

  // Shopify client layer (using fake for now)
  // TODO: Replace FakeShopifyClientLive with real GraphQL client
  const ShopifyClientLayer = FakeShopifyClientLive

  yield* Effect.provide(
    Effect.gen(function* () {
      yield* Effect.logInfo(`Starting ${CONSUMER_NAME} consumer...`)

      // Setup shared exchanges
      yield* setupTopology

      // Setup this consumer's queues
      yield* setupConsumerQueue(CONSUMER_NAME)

      yield* Effect.logInfo("RabbitMQ topology initialized")

      // Start shopify sync consumer
      yield* startConsumer(CONSUMER_NAME, shopifySyncHandler)

      yield* Effect.logInfo(`${CONSUMER_NAME} consumer ready - waiting for PilotProductPublished events...`)

      yield* Effect.never
    }),
    Layer.mergeAll(
      RabbitMQLayer,
      LoggerLive,
      PilotProductRepositoryLayer,
      ShopifyClientLayer
    )
  )
})

// ============================================
// RUN
// ============================================

NodeRuntime.runMain(program)
