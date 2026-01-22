// src/composition/layers/development.layer.ts

import { Layer } from "effect"
import {
  InMemoryPilotProductRepositoryLive,
  InMemoryCatalogProductRepositoryLive,
  UuidIdGeneratorLive,
  SystemClockLive,
  ConsoleEventPublisherLive
} from "../../infrastructure"

// ============================================
// DEVELOPMENT LAYER
// In-memory storage, console logging
// ============================================

export const DevelopmentLayer = Layer.mergeAll(
  InMemoryPilotProductRepositoryLive,
  InMemoryCatalogProductRepositoryLive,
  UuidIdGeneratorLive,
  SystemClockLive,
  ConsoleEventPublisherLive
)
