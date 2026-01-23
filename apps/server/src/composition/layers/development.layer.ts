// src/composition/layers/development.layer.ts

import { Layer } from "effect"
import {
  InMemoryCatalogProductRepositoryLive,
  UuidIdGeneratorLive,
  SystemClockLive,
  ConsoleEventPublisherLive,
  MongoDatabaseLive,
  MongodbPilotProductRepositoryLive
} from "../../infrastructure"

// ============================================
// DEVELOPMENT LAYER
// MongoDB for pilot products, in-memory for catalog
// ============================================

// MongoDB repository layer with its database dependency
const PilotProductLayer = MongodbPilotProductRepositoryLive.pipe(
  Layer.provide(MongoDatabaseLive)
)

export const DevelopmentLayer = Layer.mergeAll(
  PilotProductLayer,
  InMemoryCatalogProductRepositoryLive,
  UuidIdGeneratorLive,
  SystemClockLive,
  ConsoleEventPublisherLive
)
