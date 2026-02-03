// src/main.ts
// Shopify Sync Consumer - syncs domain events to Shopify

import { Effect, Layer } from 'effect'
import { NodeRuntime } from '@effect/platform-node'
import {
  FakeShopifyClientLive,
  JsonLogger,
  MongoDatabaseLive,
  MongodbPilotProductRepositoryLive,
  PrettyLogger,
  RabbitMQConfigLive,
  RabbitMQConnectionLayer,
  shopifySyncHandler,
  startConsumer,
  SystemClockLive,
} from '@maison-amane/server'
import {
  ConsumerConfig,
  createLoggerLayer,
  declareConsumerInfrastructure,
  EXCHANGES,
  ROUTING_KEYS,
} from '@maison-amane/shared-kernel'

// ============================================
// CONSUMER IDENTITY
// ============================================

const CONSUMER_NAME = 'shopify-sync'

// ============================================
// MAIN PROGRAM
// ============================================

const program = Effect.gen(function* () {
  const { nodeEnv, logLevel } = yield* ConsumerConfig

  const LoggerLive = createLoggerLayer(nodeEnv !== 'production', logLevel, PrettyLogger, JsonLogger)

  const RabbitMQLayer = Layer.provideMerge(RabbitMQConnectionLayer, RabbitMQConfigLive)

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

      yield* declareConsumerInfrastructure({
        queuePrefix: 'shopify-sync',
        exchange: EXCHANGES.PILOT_EVENTS,
        routingKeys: [ROUTING_KEYS.PRODUCT_PUBLISHED, ROUTING_KEYS.PRODUCT_UPDATED],
      })

      // Start shopify sync consumer
      yield* startConsumer(CONSUMER_NAME, shopifySyncHandler)

      yield* Effect.logInfo(
        `${CONSUMER_NAME} consumer ready - waiting for PilotProductPublished and PilotProductUpdated events...`
      )

      yield* Effect.never
    }),
    Layer.mergeAll(
      RabbitMQLayer,
      LoggerLive,
      PilotProductRepositoryLayer,
      ShopifyClientLayer,
      SystemClockLive
    )
  )
})

// ============================================
// RUN
// ============================================

NodeRuntime.runMain(program)
