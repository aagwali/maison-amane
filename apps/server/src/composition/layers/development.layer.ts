// src/composition/layers/development.layer.ts

import { Layer } from 'effect'

import {
  ConsoleEventPublisherLive,
  InMemoryMediaRepositoryLive,
  InMemoryPilotProductRepositoryLive,
  MongoDatabaseLive,
  MongodbMediaRepositoryLive,
  MongodbPilotProductRepositoryLive,
  RabbitMQEventPublisherLayer,
  RabbitMQSetupLayer,
  SystemClockLive,
  UuidIdGeneratorLive,
} from '../../infrastructure'

// ============================================
// DEVELOPMENT LAYER
// MongoDB for pilot products
// Catalog is managed by the catalog-projection consumer
// ============================================

// MongoDB repository layer with its database dependency
const PilotProductLayer = MongodbPilotProductRepositoryLive
  .pipe(Layer.provide(MongoDatabaseLive))

const MediaRepositoryLayer = MongodbMediaRepositoryLive
  .pipe(Layer.provide(MongoDatabaseLive))

// RabbitMQ event publisher with topology setup (exchanges, queues, bindings)
// RabbitMQSetupLayer ensures topology is created before publishing
const RabbitMQPublisherLayer = RabbitMQEventPublisherLayer
  .pipe(Layer.provide(RabbitMQSetupLayer))

// ============================================
// DEVELOPMENT LAYER WITH RABBITMQ
// ============================================

export const DevelopmentLayer = Layer.mergeAll(
  PilotProductLayer,
  MediaRepositoryLayer,
  UuidIdGeneratorLive,
  SystemClockLive,
  RabbitMQPublisherLayer
)

// ============================================
// DEVELOPMENT LAYER WITH CONSOLE (fallback)
// ============================================

export const DevelopmentLayerWithConsole = Layer.mergeAll(
  InMemoryPilotProductRepositoryLive,
  InMemoryMediaRepositoryLive,
  UuidIdGeneratorLive,
  SystemClockLive,
  ConsoleEventPublisherLive
)
