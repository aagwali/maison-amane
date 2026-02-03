// src/main.ts
// Catalog Projection Consumer - maintains read model for alternative UI

import { Effect, Layer } from 'effect'
import { NodeRuntime } from '@effect/platform-node'
import {
  catalogProjectionHandler,
  JsonLogger,
  MongoDatabaseLive,
  MongodbCatalogProductRepositoryLive,
  PrettyLogger,
  RabbitMQConfigLive,
  RabbitMQConnectionLayer,
  startConsumer,
} from '@maison-amane/server'
import {
  BootstrapConfig,
  createLoggerLayer,
  declareConsumerInfrastructure,
  EXCHANGES,
  ROUTING_KEYS,
} from '@maison-amane/shared-kernel'

// ============================================
// CONSUMER IDENTITY
// ============================================

const CONSUMER_NAME = 'catalog-projection'

// ============================================
// MAIN PROGRAM
// ============================================

const program = Effect.gen(function* () {
  const { nodeEnv, logLevel } = yield* BootstrapConfig

  const LoggerLive = createLoggerLayer(nodeEnv !== 'production', logLevel, PrettyLogger, JsonLogger)

  const RabbitMQLayer = Layer.provideMerge(RabbitMQConnectionLayer, RabbitMQConfigLive)

  // MongoDB repository layer with its database dependency
  const CatalogProductRepositoryLayer = MongodbCatalogProductRepositoryLive.pipe(
    Layer.provide(MongoDatabaseLive)
  )

  yield* Effect.provide(
    Effect.gen(function* () {
      yield* Effect.logInfo(`Starting ${CONSUMER_NAME} consumer...`)

      yield* declareConsumerInfrastructure({
        queuePrefix: 'catalog-projection',
        exchange: EXCHANGES.PILOT_EVENTS,
        routingKeys: [ROUTING_KEYS.PRODUCT_PUBLISHED, ROUTING_KEYS.PRODUCT_UPDATED],
      })

      // Start catalog projection consumer
      yield* startConsumer(CONSUMER_NAME, catalogProjectionHandler)

      yield* Effect.logInfo(
        `${CONSUMER_NAME} consumer ready - waiting for PilotProductPublished and PilotProductUpdated events...`
      )

      yield* Effect.never
    }),
    Layer.mergeAll(RabbitMQLayer, LoggerLive, CatalogProductRepositoryLayer)
  )
})

// ============================================
// RUN
// ============================================

NodeRuntime.runMain(program)
