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
  RabbitMQConnectionLive,
  startConsumer,
} from '@maison-amane/server'
import {
  bootstrapConsumer,
  createLoggerLive,
  EXCHANGES,
  ROUTING_KEYS,
} from '@maison-amane/shared-kernel'
import { provide } from 'effect/Effect'

// ============================================
// CONSUMER IDENTITY
// ============================================

const CONSUMER_NAME = 'catalog-projection'

// ============================================
// LAYERS
// ============================================

const LoggerLayer = createLoggerLive(PrettyLogger, JsonLogger)

const RabbitMQLayer = Layer.provideMerge(RabbitMQConnectionLive, RabbitMQConfigLive)

const CatalogProductRepositoryLayer = MongodbCatalogProductRepositoryLive
  .pipe(Layer.provide(MongoDatabaseLive))

const layers = Layer.mergeAll(RabbitMQLayer, LoggerLayer, CatalogProductRepositoryLayer)

// ============================================
// MAIN PROGRAM
// ============================================

const program = bootstrapConsumer({
  consumerName: CONSUMER_NAME,
  queuePrefix: 'catalog-projection',
  exchange: EXCHANGES.PILOT_EVENTS,
  routingKeys: [ROUTING_KEYS.PILOT.PRODUCT_PUBLISHED, ROUTING_KEYS.PILOT.PRODUCT_UPDATED],
  startConsumer: startConsumer(CONSUMER_NAME, catalogProjectionHandler),
})
  .pipe(provide(layers))

// ============================================
// RUN
// ============================================

NodeRuntime.runMain(program)
