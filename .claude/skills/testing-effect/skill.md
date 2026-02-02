---
name: testing-effect
description: |
  Génère des suites de tests pour handlers et domain avec Effect-TS.
  Utiliser quand: (1) Écrire des tests d'intégration pour handlers, (2) Créer des test doubles (stubs, spies), (3) Configurer un TestLayer, (4) Tester des domain services.
  Patterns: provideTestLayer, StubClock, StubIdGenerator, SpyEventPublisher, fixtures.
---

# Testing avec Effect

## Stratégie de test

```
┌─────────────────────────────────────────────────────────────┐
│  TESTS UNITAIRES (purs, pas de Layer)                       │
│  - Domain services (state machines)                         │
│  - Validation schemas                                       │
│  - Mappers                                                  │
│  - Value object constructors                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  TESTS D'INTÉGRATION (avec TestLayer)                       │
│  - Command handlers                                         │
│  - Query handlers                                           │
│  - Event handlers                                           │
└─────────────────────────────────────────────────────────────┘
```

## Pattern TestLayer

```typescript
// test-utils/test-layer.ts
import { Layer } from 'effect'

import { InMemoryPilotProductRepositoryLive } from '../infrastructure/persistence/in-memory'
import { StubIdGeneratorLive, StubClockLive, SpyEventPublisherLive, TEST_DATE } from './'

export interface TestContext {
  readonly layer: Layer.Layer</* dependencies */>
  readonly eventSpy: SpyEventPublisher
}

export const provideTestLayer = (): TestContext => {
  const { layer: spyLayer, spy: eventSpy } = SpyEventPublisherLive()

  const layer = Layer.mergeAll(
    InMemoryPilotProductRepositoryLive,
    StubIdGeneratorLive(),
    StubClockLive(TEST_DATE),
    spyLayer
  )

  return { layer, eventSpy }
}
```

## Test d'intégration (handler)

```typescript
// application/{context}/handlers/{handler}.handler.test.ts
import { Effect } from 'effect'
import { beforeEach, describe, expect, it } from 'vitest'

import { provideTestLayer, type TestContext, TEST_DATE } from '../../../test-utils'
import { handleCreateOrder } from './create-order.handler'

describe('handleCreateOrder', () => {
  let testCtx: TestContext

  beforeEach(() => {
    testCtx = provideTestLayer() // Nouvel état isolé par test
  })

  describe('success cases', () => {
    it('creates order with deterministic ID', async () => {
      const command = buildCommand({
        /* data */
      })

      const result = await Effect.runPromise(
        handleCreateOrder(command).pipe(Effect.provide(testCtx.layer))
      )

      expect(result.id).toBe('test-order-1')
      expect(result.createdAt).toEqual(TEST_DATE)
    })
  })

  describe('event emission', () => {
    it('emits OrderCreated event', async () => {
      const command = buildCommand({
        /* data */
      })

      await Effect.runPromise(handleCreateOrder(command).pipe(Effect.provide(testCtx.layer)))

      expect(testCtx.eventSpy.emittedEvents).toHaveLength(1)
      expect(testCtx.eventSpy.lastEvent?._tag).toBe('OrderCreated')
    })
  })

  describe('error cases', () => {
    it('fails with validation error', async () => {
      const command = buildCommand({ label: '' }) // Invalid

      const result = await Effect.runPromise(
        handleCreateOrder(command).pipe(Effect.either, Effect.provide(testCtx.layer))
      )

      expect(result._tag).toBe('Left')
    })
  })
})
```

## Test unitaire (domain service)

```typescript
// domain/{context}/services/{service}.machine.test.ts
import { describe, expect, it } from 'vitest'

import { SyncStatusMachine, MakeNotSynced, MakeSyncFailed } from '../'

describe('SyncStatusMachine', () => {
  it('starts with NotSynced', () => {
    const status = SyncStatusMachine.initial()
    expect(status._tag).toBe('NotSynced')
  })

  it('increments attempts on failure', () => {
    const first = SyncStatusMachine.markFailed(
      MakeNotSynced(),
      { code: 'E', message: 'm' },
      new Date()
    )
    expect(first.attempts).toBe(1)

    const second = SyncStatusMachine.markFailed(first, { code: 'E', message: 'm' }, new Date())
    expect(second.attempts).toBe(2)
  })
})
```

## Exécution

```bash
pnpm test                 # Run all tests
pnpm test:watch           # Watch mode
pnpm test:coverage        # Coverage report
```

## Références détaillées

- [Tests d'intégration](references/integration-testing.md) - Handlers avec TestLayer
- [Test Doubles](references/test-doubles.md) - Stubs, Spies, Fakes
- [Fixtures](references/fixtures.md) - Builders et données de test
