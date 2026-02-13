// src/main.ts
// Catalog Projection Consumer - maintains read model for alternative UI

import { Layer } from 'effect'
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
import { logInfo, gen, provide, never } from 'effect/Effect'

// ============================================
// CONSUMER IDENTITY
// ============================================

const CONSUMER_NAME = 'catalog-projection'

// ============================================
// MAIN PROGRAM
// ============================================

const program = gen(function* () {
  const { nodeEnv, logLevel } = yield* BootstrapConfig

  const LoggerLive = createLoggerLayer(nodeEnv !== 'production', logLevel, PrettyLogger, JsonLogger)

  const RabbitMQLayer = Layer.provideMerge(RabbitMQConnectionLayer, RabbitMQConfigLive)

  const CatalogProductRepositoryLayer = MongodbCatalogProductRepositoryLive
    .pipe(Layer.provide(MongoDatabaseLive))

  const layers = Layer.mergeAll(RabbitMQLayer, LoggerLive, CatalogProductRepositoryLayer)

  gen(function* () {
    yield* logInfo(`Starting ${CONSUMER_NAME} consumer...`)

    yield* declareConsumerInfrastructure({
      queuePrefix: 'catalog-projection',
      exchange: EXCHANGES.PILOT_EVENTS,
      routingKeys: [ROUTING_KEYS.PRODUCT_PUBLISHED, ROUTING_KEYS.PRODUCT_UPDATED],
    })

    yield* startConsumer(CONSUMER_NAME, catalogProjectionHandler)

    yield* logInfo(
      `${CONSUMER_NAME} consumer ready - waiting for PilotProductPublished and PilotProductUpdated events...`
    )

    yield* never
  })
    .pipe(provide(layers))
})

// ============================================
// RUN
// ============================================

NodeRuntime.runMain(program)
