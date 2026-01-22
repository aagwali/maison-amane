// src/composition/layers/test.layer.ts

import { Layer } from "effect"
import {
  InMemoryPilotProductRepositoryLive,
  InMemoryCatalogProductRepositoryLive,
  UuidIdGeneratorLive,
  SystemClockLive,
  ConsoleEventPublisherLive
} from "../../infrastructure"

// ============================================
// TEST LAYER
// Same as development for now, can be customized
// with mocks/stubs for specific test scenarios
// ============================================

export const TestLayer = Layer.mergeAll(
  InMemoryPilotProductRepositoryLive,
  InMemoryCatalogProductRepositoryLive,
  UuidIdGeneratorLive,
  SystemClockLive,
  ConsoleEventPublisherLive
)
