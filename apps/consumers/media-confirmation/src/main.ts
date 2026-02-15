// Media Confirmation Consumer - confirms media referenced by pilot products

import { Layer } from 'effect'
import { NodeRuntime } from '@effect/platform-node'
import { provide } from 'effect/Effect'
import {
  mediaConfirmationHandler,
  JsonLogger,
  MongoDatabaseLive,
  MongodbMediaRepositoryLive,
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

// ============================================
// CONSUMER IDENTITY
// ============================================

const CONSUMER_NAME = 'media-confirmation'

// ============================================
// LAYERS
// ============================================

const LoggerLayer = createLoggerLive(PrettyLogger, JsonLogger)

const RabbitMQLayer = Layer.provideMerge(RabbitMQConnectionLive, RabbitMQConfigLive)

const MediaRepositoryLayer = MongodbMediaRepositoryLive
  .pipe(Layer.provide(MongoDatabaseLive))

const layers = Layer.mergeAll(RabbitMQLayer, LoggerLayer, MediaRepositoryLayer)

// ============================================
// MAIN PROGRAM
// ============================================

const program = bootstrapConsumer({
  consumerName: CONSUMER_NAME,
  queuePrefix: CONSUMER_NAME,
  exchange: EXCHANGES.PILOT_EVENTS,
  routingKeys: [ROUTING_KEYS.PILOT.PRODUCT_CREATED],
  startConsumer: startConsumer(CONSUMER_NAME, mediaConfirmationHandler),
})
  .pipe(provide(layers))

// ============================================
// RUN
// ============================================

NodeRuntime.runMain(program)
