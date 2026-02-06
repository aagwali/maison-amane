// src/main.ts
// Shopify Sync Consumer - syncs domain events to Shopify

import { Layer } from 'effect'
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
  BootstrapConfig,
  createLoggerLayer,
  declareConsumerInfrastructure,
  EXCHANGES,
  ROUTING_KEYS,
} from '@maison-amane/shared-kernel'
import { logInfo, gen, provide, never } from 'effect/Effect'

// ============================================
// CONSUMER IDENTITY
// ============================================

const CONSUMER_NAME = 'shopify-sync'

// ============================================
// MAIN PROGRAM
// ============================================

const program = gen(function* () {
  const { nodeEnv, logLevel } = yield* BootstrapConfig

  const LoggerLive = createLoggerLayer(nodeEnv !== 'production', logLevel, PrettyLogger, JsonLogger)

  const RabbitMQLayer = Layer.provideMerge(RabbitMQConnectionLayer, RabbitMQConfigLive)

  const PilotProductRepositoryLayer = MongodbPilotProductRepositoryLive.pipe(
    Layer.provide(MongoDatabaseLive)
  )

  const ShopifyClientLayer = FakeShopifyClientLive

  const layers = Layer.mergeAll(
    RabbitMQLayer,
    LoggerLive,
    PilotProductRepositoryLayer,
    ShopifyClientLayer,
    SystemClockLive
  )

  gen(function* () {
    yield* logInfo(`Starting ${CONSUMER_NAME} consumer...`)

    yield* declareConsumerInfrastructure({
      queuePrefix: 'shopify-sync',
      exchange: EXCHANGES.PILOT_EVENTS,
      routingKeys: [ROUTING_KEYS.PRODUCT_PUBLISHED, ROUTING_KEYS.PRODUCT_UPDATED],
    })

    yield* startConsumer(CONSUMER_NAME, shopifySyncHandler)

    yield* logInfo(
      `${CONSUMER_NAME} consumer ready - waiting for PilotProductPublished and PilotProductUpdated events...`
    )

    yield* never
  }).pipe(provide(layers))
})

// ============================================
// RUN
// ============================================

NodeRuntime.runMain(program)
