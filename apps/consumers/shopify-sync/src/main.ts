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
  RabbitMQConnectionLive,
  shopifySyncHandler,
  startConsumer,
  SystemClockLive,
} from '@maison-amane/server'
import {
  bootstrapConsumer,
  createLoggerLive as createLoggerLive,
  EXCHANGES,
  ROUTING_KEYS,
} from '@maison-amane/shared-kernel'
import { provide } from 'effect/Effect'

// ============================================
// CONSUMER IDENTITY
// ============================================

const CONSUMER_NAME = 'shopify-sync'

// ============================================
// LAYERS
// ============================================

const LoggerLayer = createLoggerLive(PrettyLogger, JsonLogger)

const RabbitMQLayer = Layer.provideMerge(RabbitMQConnectionLive, RabbitMQConfigLive)

const PilotProductRepositoryLayer = MongodbPilotProductRepositoryLive
  .pipe(Layer.provide(MongoDatabaseLive))

const ShopifyClientLayer = FakeShopifyClientLive

const layers = Layer.mergeAll(
  RabbitMQLayer,
  LoggerLayer,
  PilotProductRepositoryLayer,
  ShopifyClientLayer,
  SystemClockLive
)

// ============================================
// MAIN PROGRAM
// ============================================

const program = bootstrapConsumer({
  consumerName: CONSUMER_NAME,
  queuePrefix: 'shopify-sync',
  exchange: EXCHANGES.PILOT_EVENTS,
  routingKeys: [ROUTING_KEYS.PILOT.PRODUCT_PUBLISHED, ROUTING_KEYS.PILOT.PRODUCT_UPDATED],
  startConsumer: startConsumer(CONSUMER_NAME, shopifySyncHandler),
})
  .pipe(provide(layers))

// ============================================
// RUN
// ============================================

NodeRuntime.runMain(program)
