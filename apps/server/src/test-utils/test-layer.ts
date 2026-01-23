// src/test-utils/test-layer.ts
//
// TEST LAYER: Composes all test utilities into a single layer for handler tests.
//
// ============================================
// TESTING STRATEGY (Hybrid Approach)
// ============================================
//
// This project uses a hybrid testing strategy:
//
// 1. UNIT TESTS (pure, no Layer needed)
//    - Domain value objects (schemas)
//    - Domain services (SyncStatusMachine, ViewsService)
//    - These are pure functions, test them directly
//
// 2. INTEGRATION TESTS (with TestLayer)
//    - Application handlers
//    - Use real in-memory repository (not mocked)
//    - Use deterministic ID generator (predictable IDs)
//    - Use fixed clock (predictable timestamps)
//    - Use spy event publisher (verify events)
//
// This approach tests the real Effect composition while
// keeping tests fast and deterministic.
// ============================================

import { Layer } from "effect"
import { InMemoryPilotProductRepositoryLive } from "../infrastructure/persistence/in-memory/pilot-product.repository"
import { PilotProductRepository, IdGenerator, Clock, EventPublisher } from "../ports/driven"
import { DeterministicIdGeneratorLive } from "./deterministic-id-generator"
import { FixedClockLive, TEST_DATE } from "./fixed-clock"
import { SpyEventPublisherLive, type SpyEventPublisher } from "./spy-event-publisher"

export { TEST_DATE }

// The layer provides all dependencies needed by handlers
type TestLayerServices = PilotProductRepository | IdGenerator | Clock | EventPublisher

export interface TestContext {
  layer: Layer.Layer<TestLayerServices, never, never>
  eventSpy: SpyEventPublisher
}

export const makeTestLayer = (): TestContext => {
  const { layer: eventPublisherLayer, spy: eventSpy } = SpyEventPublisherLive()

  const layer = Layer.mergeAll(
    InMemoryPilotProductRepositoryLive,
    DeterministicIdGeneratorLive(),
    FixedClockLive(),
    eventPublisherLayer
  )

  return { layer, eventSpy }
}
