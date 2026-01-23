// src/main.ts
// Shopify Sync Consumer - syncs domain events to Shopify

import { Config, Effect, Layer, Logger, LogLevel } from 'effect'

import { NodeRuntime } from '@effect/platform-node'
import {
  helloWorldHandler,
  JsonLogger,
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

  yield* Effect.provide(
    Effect.gen(function* () {
      yield* Effect.logInfo(`Starting ${CONSUMER_NAME} consumer...`)

      // Setup shared exchanges
      yield* setupTopology

      // Setup this consumer's queues
      yield* setupConsumerQueue(CONSUMER_NAME)

      yield* Effect.logInfo("RabbitMQ topology initialized")

      // TODO: Replace with shopifySyncHandler
      yield* startConsumer(CONSUMER_NAME, helloWorldHandler)

      yield* Effect.logInfo("Hello from consumer 1! (Shopify Sync) - waiting for messages...")

      yield* Effect.never
    }),
    Layer.mergeAll(RabbitMQLayer, LoggerLive)
  )
})

// ============================================
// RUN
// ============================================

NodeRuntime.runMain(program)
