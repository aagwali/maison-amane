# Test Doubles

## Stub Clock (Fixed Time)

```typescript
// test-utils/fixed-clock.ts
import { Effect, Layer } from 'effect'
import { Clock } from '../ports/driven'

export const TEST_DATE = new Date('2024-01-15T10:00:00.000Z')

export const StubClockLive = (fixedDate: Date = TEST_DATE) =>
  Layer.succeed(Clock, {
    now: () => Effect.succeed(fixedDate),
  })
```

**Usage** : Garantit des timestamps identiques entre exécutions.

## Stub ID Generator (Deterministic)

```typescript
// test-utils/deterministic-id-generator.ts
import { Effect, Layer } from 'effect'
import { IdGenerator } from '../ports/driven'
import { MakeProductId, MakeVariantId } from '../domain/pilot'

export interface StubIdGenerator {
  readonly generateProductId: () => Effect.Effect<ProductId>
  readonly generateVariantId: () => Effect.Effect<VariantId>
  readonly generateCorrelationId: () => Effect.Effect<string>
  readonly reset: () => void
}

export const StubIdGeneratorLive = (prefix = 'test') => {
  let productCounter = 0
  let variantCounter = 0

  const service: StubIdGenerator = {
    generateProductId: () => Effect.succeed(MakeProductId(`${prefix}-product-${++productCounter}`)),

    generateVariantId: () => Effect.succeed(MakeVariantId(`${prefix}-variant-${++variantCounter}`)),

    generateCorrelationId: () => Effect.succeed(`${prefix}-correlation-id`),

    reset: () => {
      productCounter = 0
      variantCounter = 0
    },
  }

  return Layer.succeed(IdGenerator, service)
}
```

**Usage** : IDs prévisibles `test-product-1`, `test-product-2`, etc.

## Spy Event Publisher

```typescript
// test-utils/spy-event-publisher.ts
import { Effect, Layer } from 'effect'
import { EventPublisher } from '../ports/driven'
import type { PilotDomainEvent } from '../domain/pilot'

export interface SpyEventPublisher {
  readonly emittedEvents: readonly PilotDomainEvent[]
  readonly lastEvent: PilotDomainEvent | undefined
  readonly hasEmitted: (tag: string) => boolean
  readonly clear: () => void
}

export const SpyEventPublisherLive = (): {
  layer: Layer.Layer<EventPublisher>
  spy: SpyEventPublisher
} => {
  const events: PilotDomainEvent[] = []

  const spy: SpyEventPublisher = {
    get emittedEvents() {
      return events
    },
    get lastEvent() {
      return events[events.length - 1]
    },
    hasEmitted: (tag) => events.some((e) => e._tag === tag),
    clear: () => {
      events.length = 0
    },
  }

  const layer = Layer.succeed(EventPublisher, {
    publish: (event) =>
      Effect.sync(() => {
        events.push(event)
      }),
  })

  return { layer, spy }
}
```

**Usage** : Vérifier quels events ont été émis.

```typescript
// Dans un test
expect(testCtx.eventSpy.emittedEvents).toHaveLength(1)
expect(testCtx.eventSpy.lastEvent?._tag).toBe('ProductPublished')
expect(testCtx.eventSpy.hasEmitted('ProductPublished')).toBe(true)
```

## Test Layer Composition

```typescript
// test-utils/test-layer.ts
import { Layer } from 'effect'

import { InMemoryPilotProductRepositoryLive } from '../infrastructure/persistence/in-memory'
import { StubIdGeneratorLive, StubClockLive, SpyEventPublisherLive, TEST_DATE } from './'

export interface TestContext {
  readonly layer: Layer.Layer<PilotProductRepository | IdGenerator | Clock | EventPublisher>
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

## Tableau récapitulatif

| Double                 | Type | Comportement                |
| ---------------------- | ---- | --------------------------- |
| **StubClock**          | Stub | Retourne date fixe          |
| **StubIdGenerator**    | Stub | Génère IDs séquentiels      |
| **SpyEventPublisher**  | Spy  | Capture events + assertions |
| **InMemoryRepository** | Fake | CRUD en mémoire             |

## Différence Stub vs Spy vs Fake

- **Stub** : Retourne valeurs prédéfinies (Clock, IdGenerator)
- **Spy** : Capture les appels pour assertions (EventPublisher)
- **Fake** : Implémentation simplifiée fonctionnelle (InMemoryRepository)

## Checklist

- [ ] `TEST_DATE` constante partagée
- [ ] StubIdGenerator avec compteurs reset-ables
- [ ] SpyEventPublisher avec accesseurs `emittedEvents`, `lastEvent`
- [ ] Factory function pour chaque double
- [ ] `provideTestLayer()` combine tous les doubles
- [ ] Pas de mocking de fonctions (préférer fakes/stubs)
