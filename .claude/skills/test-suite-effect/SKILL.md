---
name: test-suite-effect
description: Génère des suites de tests pour handlers et domain avec Effect. Utiliser pour créer des tests d'intégration avec test doubles déterministes.
---

# Test Suite Generator (Effect)

## Quand utiliser ce skill

- "Créer des tests pour le handler [nom]"
- "Générer une suite de tests pour [module]"
- "Ajouter des test doubles pour [service]"
- "Tester le comportement de [feature]"

## Contexte nécessaire

1. **Module à tester** : handler, domain service, mapper
2. **Comportements à vérifier** : cas de succès, erreurs, edge cases
3. **Dépendances** : repositories, services (Clock, IdGenerator, EventPublisher)
4. **Events émis** : si le handler émet des domain events

## Workflow

### 1. Analyse

- Identifier le handler/module à tester
- Lister les dépendances à mocker
- Définir les cas de test (succès, erreurs, limites)
- Identifier les effects secondaires à vérifier (events)

### 2. Génération

Structure des fichiers de test :

```
test-utils/
├── deterministic-id-generator.ts   # Stub prévisible
├── fixed-clock.ts                  # Clock fixe
├── spy-event-publisher.ts          # Capture des events
├── test-layer.ts                   # Composition test
└── fixtures/                       # Données de test
    └── {entity}.fixtures.ts

application/{context}/handlers/
└── {handler}.handler.test.ts       # Tests d'intégration
```

### 3. Validation

- [ ] Tests déterministes (pas de random, dates fixes)
- [ ] Isolation via test layer
- [ ] Vérification des effects secondaires (events)
- [ ] Couverture success, errors, edge cases

## Patterns techniques

### Pattern 1 : Test Date constante

```typescript
// test-utils/constants.ts
export const TEST_DATE = new Date('2024-01-01T00:00:00.000Z')
```

### Pattern 2 : Fixed Clock (Stub)

```typescript
// test-utils/fixed-clock.ts
import { Effect } from 'effect'
import type { ClockService } from '../ports/driven'

export const stubClock = (date: Date = TEST_DATE): ClockService => ({
  now: () => Effect.succeed(date),
})

// Usage dans un test
const clock = stubClock(new Date('2024-06-15T10:30:00Z'))
```

### Pattern 3 : Deterministic ID Generator (Stub)

```typescript
// test-utils/deterministic-id-generator.ts
import { Effect } from 'effect'
import { MakeProductId, MakeVariantId } from '../domain/pilot'
import type { IdGeneratorService } from '../ports/driven'

export interface StubIdGenerator extends IdGeneratorService {
  readonly reset: () => void
}

export const stubIdGenerator = (): StubIdGenerator => {
  let productCounter = 0
  let variantCounter = 0

  return {
    generateProductId: () => Effect.succeed(MakeProductId(`test-product-${++productCounter}`)),

    generateVariantId: () => Effect.succeed(MakeVariantId(`test-variant-${++variantCounter}`)),

    generateCorrelationId: () => Effect.succeed('test-correlation-id'),

    reset: () => {
      productCounter = 0
      variantCounter = 0
    },
  }
}

// Usage : IDs prévisibles test-product-1, test-product-2, ...
```

### Pattern 4 : Spy Event Publisher

```typescript
// test-utils/spy-event-publisher.ts
import { Effect } from 'effect'
import type { PilotDomainEvent } from '../domain/pilot'
import type { EventPublisherService } from '../ports/driven'

export interface SpyEventPublisher extends EventPublisherService {
  readonly emittedEvents: PilotDomainEvent[]
  readonly lastEvent: () => PilotDomainEvent | undefined
  readonly clear: () => void
}

export const spyEventPublisher = (): SpyEventPublisher => {
  const emittedEvents: PilotDomainEvent[] = []

  return {
    publish: (event) =>
      Effect.sync(() => {
        emittedEvents.push(event)
      }),

    emittedEvents,

    lastEvent: () => emittedEvents[emittedEvents.length - 1],

    clear: () => {
      emittedEvents.length = 0
    },
  }
}

// Usage : vérifier les events émis après une action
```

### Pattern 5 : Test Layer Composition

```typescript
// test-utils/test-layer.ts
import { Layer } from 'effect'

import { Clock, EventPublisher, IdGenerator, PilotProductRepository } from '../ports/driven'
import { InMemoryPilotProductRepositoryLive } from '../infrastructure/persistence/in-memory'
import { stubClock, stubIdGenerator, spyEventPublisher, TEST_DATE } from './'

export interface TestContext {
  readonly layer: Layer.Layer<PilotProductRepository | IdGenerator | Clock | EventPublisher>
  readonly idGen: ReturnType<typeof stubIdGenerator>
  readonly eventSpy: ReturnType<typeof spyEventPublisher>
  readonly clock: ReturnType<typeof stubClock>
}

export const provideTestLayer = (): TestContext => {
  const idGen = stubIdGenerator()
  const clock = stubClock(TEST_DATE)
  const eventSpy = spyEventPublisher()

  const layer = Layer.mergeAll(
    InMemoryPilotProductRepositoryLive,
    Layer.succeed(IdGenerator, idGen),
    Layer.succeed(Clock, clock),
    Layer.succeed(EventPublisher, eventSpy)
  )

  return { layer, idGen, eventSpy, clock }
}

// Usage dans beforeEach : isolation totale entre tests
```

### Pattern 6 : Fixtures de test

```typescript
// test-utils/fixtures/pilot-product.fixtures.ts
import {
  PriceRange,
  ProductCategory,
  ProductStatus,
  ProductType,
  Size,
  ViewType,
} from '../../domain/pilot'
import type { UnvalidatedProductData } from '../../application/pilot/commands'

// Données valides par défaut
export const validProductData: UnvalidatedProductData = {
  label: 'Tapis Berbère Atlas',
  type: ProductType.TAPIS,
  category: ProductCategory.RUNNER,
  description: 'Beautiful handmade Berber rug from the Atlas mountains',
  priceRange: PriceRange.PREMIUM,
  variants: [{ size: Size.REGULAR }, { size: Size.LARGE }],
  views: [
    { viewType: ViewType.FRONT, imageUrl: 'https://cdn.example.com/front.jpg' },
    { viewType: ViewType.DETAIL, imageUrl: 'https://cdn.example.com/detail.jpg' },
    { viewType: ViewType.BACK, imageUrl: 'https://cdn.example.com/back.jpg' },
    { viewType: ViewType.AMBIANCE, imageUrl: 'https://cdn.example.com/ambiance.jpg' },
  ],
  status: ProductStatus.DRAFT,
}

// Builder pour variations
export const buildProductData = (
  overrides: Partial<UnvalidatedProductData> = {}
): UnvalidatedProductData => ({
  ...validProductData,
  ...overrides,
})

// Données invalides pour tests d'erreur
export const invalidProductData = {
  emptyLabel: buildProductData({ label: '   ' }),
  noVariants: buildProductData({ variants: [] }),
  missingViews: buildProductData({ views: [] }),
}
```

### Pattern 7 : Command Builder

```typescript
// test-utils/fixtures/command.fixtures.ts
import { MakeCorrelationId, MakeUserId } from '../../domain/shared'
import {
  MakePilotProductCreationCommand,
  type UnvalidatedProductData,
} from '../../application/pilot/commands'
import { validProductData, TEST_DATE } from './'

export const buildCommand = (
  data: UnvalidatedProductData = validProductData,
  overrides: {
    correlationId?: string
    userId?: string
    timestamp?: Date
  } = {}
) =>
  MakePilotProductCreationCommand({
    data,
    correlationId: MakeCorrelationId(overrides.correlationId ?? 'test-correlation-id'),
    userId: MakeUserId(overrides.userId ?? 'test-user'),
    timestamp: overrides.timestamp ?? TEST_DATE,
  })
```

### Pattern 8 : Test d'intégration complet

```typescript
// application/{context}/handlers/{handler}.handler.test.ts
import { Effect } from 'effect'
import { beforeEach, describe, expect, it } from 'vitest'

import { ProductStatus, Size, ValidationError, ViewType } from '../../../domain/pilot'
import {
  buildCommand,
  buildProductData,
  invalidProductData,
  provideTestLayer,
  TEST_DATE,
} from '../../../test-utils'
import { handlePilotProductCreation } from './create-pilot-product.handler'

describe('handlePilotProductCreation', () => {
  let testCtx: ReturnType<typeof provideTestLayer>

  beforeEach(() => {
    // Nouveau contexte isolé pour chaque test
    testCtx = provideTestLayer()
  })

  // ============================================
  // SUCCESS CASES
  // ============================================

  describe('success cases', () => {
    it('creates a product with deterministic ID', async () => {
      const command = buildCommand()

      const result = await Effect.runPromise(
        handlePilotProductCreation(command).pipe(Effect.provide(testCtx.layer))
      )

      expect(result.id).toBe('test-product-1')
      expect(result.label).toBe('Tapis Berbère Atlas')
    })

    it('uses fixed clock for timestamps', async () => {
      const command = buildCommand()

      const result = await Effect.runPromise(
        handlePilotProductCreation(command).pipe(Effect.provide(testCtx.layer))
      )

      expect(result.createdAt).toEqual(TEST_DATE)
      expect(result.updatedAt).toEqual(TEST_DATE)
    })

    it('initializes syncStatus as NotSynced', async () => {
      const command = buildCommand()

      const result = await Effect.runPromise(
        handlePilotProductCreation(command).pipe(Effect.provide(testCtx.layer))
      )

      expect(result.syncStatus._tag).toBe('NotSynced')
    })
  })

  // ============================================
  // EVENT EMISSION
  // ============================================

  describe('event emission', () => {
    it('does NOT emit event for DRAFT status', async () => {
      const command = buildCommand(buildProductData({ status: ProductStatus.DRAFT }))

      await Effect.runPromise(
        handlePilotProductCreation(command).pipe(Effect.provide(testCtx.layer))
      )

      expect(testCtx.eventSpy.emittedEvents).toHaveLength(0)
    })

    it('emits PilotProductPublished for PUBLISHED status', async () => {
      const command = buildCommand(buildProductData({ status: ProductStatus.PUBLISHED }))

      await Effect.runPromise(
        handlePilotProductCreation(command).pipe(Effect.provide(testCtx.layer))
      )

      expect(testCtx.eventSpy.emittedEvents).toHaveLength(1)
      expect(testCtx.eventSpy.lastEvent()?._tag).toBe('PilotProductPublished')
    })

    it('includes correct metadata in event', async () => {
      const command = buildCommand(buildProductData({ status: ProductStatus.PUBLISHED }), {
        correlationId: 'custom-correlation',
        userId: 'custom-user',
      })

      await Effect.runPromise(
        handlePilotProductCreation(command).pipe(Effect.provide(testCtx.layer))
      )

      const event = testCtx.eventSpy.lastEvent()
      expect(event?.productId).toBe('test-product-1')
      expect(event?.correlationId).toBe('custom-correlation')
      expect(event?.userId).toBe('custom-user')
      expect(event?.timestamp).toEqual(TEST_DATE)
    })
  })

  // ============================================
  // ERROR CASES
  // ============================================

  describe('validation errors', () => {
    it('fails with ValidationError for empty label', async () => {
      const command = buildCommand(invalidProductData.emptyLabel)

      const result = await Effect.runPromise(
        handlePilotProductCreation(command).pipe(Effect.either, Effect.provide(testCtx.layer))
      )

      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(ValidationError)
      }
    })
  })

  // ============================================
  // EDGE CASES
  // ============================================

  describe('edge cases', () => {
    it('generates sequential IDs across multiple calls', async () => {
      const command1 = buildCommand()
      const command2 = buildCommand()

      const result1 = await Effect.runPromise(
        handlePilotProductCreation(command1).pipe(Effect.provide(testCtx.layer))
      )
      const result2 = await Effect.runPromise(
        handlePilotProductCreation(command2).pipe(Effect.provide(testCtx.layer))
      )

      expect(result1.id).toBe('test-product-1')
      expect(result2.id).toBe('test-product-2')
    })
  })
})
```

### Pattern 9 : Test de Domain Service

```typescript
// domain/{context}/services/{service}.machine.test.ts
import { describe, expect, it } from 'vitest'

import { MakeNotSynced, MakeSyncFailed, SyncStatusMachine } from './sync-status.machine'

describe('SyncStatusMachine', () => {
  describe('initial', () => {
    it('returns NotSynced state', () => {
      const status = SyncStatusMachine.initial()
      expect(status._tag).toBe('NotSynced')
    })
  })

  describe('markSynced', () => {
    it('transitions from NotSynced to Synced', () => {
      const initial = MakeNotSynced()
      const syncedAt = new Date('2024-01-15')

      const result = SyncStatusMachine.markSynced(initial, 'shopify-123', syncedAt)

      expect(result._tag).toBe('Synced')
      expect(result.shopifyProductId).toBe('shopify-123')
      expect(result.syncedAt).toEqual(syncedAt)
    })
  })

  describe('markFailed', () => {
    it('increments attempts on repeated failures', () => {
      const firstFail = SyncStatusMachine.markFailed(
        MakeNotSynced(),
        { code: 'API_ERROR', message: 'Timeout' },
        new Date()
      )
      expect(firstFail.attempts).toBe(1)

      const secondFail = SyncStatusMachine.markFailed(
        firstFail,
        { code: 'API_ERROR', message: 'Timeout' },
        new Date()
      )
      expect(secondFail.attempts).toBe(2)
    })
  })

  describe('canRetry', () => {
    it('returns true when attempts < 3', () => {
      const failed = MakeSyncFailed({
        error: { code: 'ERR', message: 'msg' },
        failedAt: new Date(),
        attempts: 2,
      })

      expect(SyncStatusMachine.canRetry(failed)).toBe(true)
    })

    it('returns false when attempts >= 3', () => {
      const failed = MakeSyncFailed({
        error: { code: 'ERR', message: 'msg' },
        failedAt: new Date(),
        attempts: 3,
      })

      expect(SyncStatusMachine.canRetry(failed)).toBe(false)
    })
  })
})
```

## Structure de fichiers générée

```
test-utils/
├── constants.ts                      # TEST_DATE, etc.
├── deterministic-id-generator.ts     # Stub IDs prévisibles
├── fixed-clock.ts                    # Clock fixe
├── spy-event-publisher.ts            # Capture events
├── test-layer.ts                     # Composition Layer de test
├── fixtures/
│   ├── pilot-product.fixtures.ts     # Données de test
│   ├── command.fixtures.ts           # Builders de commandes
│   └── index.ts
└── index.ts                          # Barrel export

application/{context}/handlers/
├── {handler}.handler.ts
└── {handler}.handler.test.ts         # Tests d'intégration

domain/{context}/services/
├── {service}.machine.ts
└── {service}.machine.test.ts         # Tests unitaires
```

## Checklist de qualité

- [ ] Tests déterministes (IDs, dates fixes)
- [ ] Isolation via `beforeEach` + `provideTestLayer()`
- [ ] Couverture des cas : success, errors, edge cases
- [ ] Vérification des effects secondaires (events émis)
- [ ] Fixtures réutilisables et composables
- [ ] Pas de dépendance à l'ordre d'exécution
- [ ] Noms de tests descriptifs (it "does X when Y")
- [ ] Assertions précises sur les valeurs attendues
