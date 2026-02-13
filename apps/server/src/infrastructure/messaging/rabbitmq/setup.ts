// src/infrastructure/messaging/rabbitmq/setup.ts

import { Layer } from 'effect'
import { provide } from 'effect/Effect'

import { RabbitMQConfigLive } from '../../../composition/config'

import { RabbitMQConnectionLive } from './connection'
import { helloWorldHandler, type MessageHandler, startConsumer } from './consumer'
import { setupConsumerQueue, setupTopology } from './topology'

// ============================================
// RABBITMQ FULL LAYER (connection + config)
// ============================================

export const RabbitMQLive = RabbitMQConnectionLive
  .pipe(Layer.provide(RabbitMQConfigLive))

// ============================================
// RABBITMQ SETUP LAYER
// Initializes topology (exchanges only)
// Provides RabbitMQConnection after topology is setup
// ============================================

export const RabbitMQSetupLayer = Layer.effectDiscard(setupTopology)
  .pipe(Layer.provide(RabbitMQConfigLive),
  Layer.provideMerge(RabbitMQLive))

// ============================================
// START CONSUMER WITH DEPENDENCIES
// ============================================

export const runConsumer = (consumerName: string, handler: MessageHandler = helloWorldHandler) =>
  startConsumer(consumerName, handler)
    .pipe(provide(RabbitMQLive))

// ============================================
// SETUP TOPOLOGY EFFECT (for one-time setup)
// ============================================

export const runSetupTopology = setupTopology
  .pipe(provide(RabbitMQLive))

// ============================================
// SETUP CONSUMER QUEUE (per-consumer)
// ============================================

export const runSetupConsumerQueue = (consumerName: string) =>
  setupConsumerQueue(consumerName)
    .pipe(provide(RabbitMQLive))
