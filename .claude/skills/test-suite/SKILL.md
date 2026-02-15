---
name: test-suite
description: "Génère et modifie les tests avec Effect-TS et Vitest : suites d'intégration pour handlers, tests unitaires domaine, test doubles déterministes. Utiliser quand: (1) Tester un handler (command ou query), (2) Ajouter des tests, (3) Créer un test double, (4) Modifier les fixtures, (5) Étendre la couverture de tests, (6) Tester un domain service, (7) Tester la validation applicative, (8) Créer une suite de tests, (9) Ajouter un test unitaire, (10) Tester l'aggregate, (11) Test the handler, (12) Add tests, (13) Create a test double, (14) Modify fixtures, (15) Extend coverage, (16) Test the domain service, (17) Test validation, (18) Create a test suite, (19) Add a unit test, (20) Test the aggregate."
---

# Test Suite Skill

## Testing Strategy

1. **Unit tests** (pure, no Layer) — domain value objects, services, aggregate methods
2. **Integration tests** (with TestLayer) — application handlers

## Workflow — Handler Test

1. Create `{handler-name}.handler.test.ts` next to the handler
2. Import the handler and `provideTestLayer`
3. Create inline fixtures with `buildCommand` helper
4. Write success cases (happy path)
5. Verify event emission via `eventSpy`
6. Test validation errors
7. Test edge cases

## Workflow — Domain Unit Test

1. Create `{entity}.test.ts` next to the entity
2. Import the entity/service to test
3. Create inline fixtures
4. Test methods/behaviors directly (no Layer needed)
5. Verify invariants

## Rules & Conventions

### Test Layer

`provideTestLayer()` returns `{ layer, eventSpy }`. The layer contains:

- In-memory repository
- Fixed clock (`TEST_DATE = 2024-01-15T10:00:00.000Z`)
- Deterministic ID generator (`test-product-1`, `test-product-2`, ...)
- Spy event publisher

```typescript
import { provideTestLayer, TEST_DATE } from '../../../test-utils/test-layer'

describe('pilotProductCreationHandler', () => {
  const { layer, eventSpy } = provideTestLayer()

  afterEach(() => eventSpy.clear())
})
```

Only `eventSpy` is exposed — clock and idGen are internal details.

### Event Spy

```typescript
// Verify event was emitted
expect(eventSpy.hasEmitted('PilotProductPublished')).toBe(true)

// Check last event details
expect(eventSpy.lastEvent?._tag).toBe('PilotProductPublished')
expect(eventSpy.lastEvent?._version).toBe(1)

// Check all emitted events
expect(eventSpy.emittedEvents).toHaveLength(1)

// Clear between tests
eventSpy.clear()
```

### Selective Imports

```typescript
import { runPromise, provide } from 'effect/Effect'
import { pipe } from 'effect/Function'
```

### Inline Fixtures

Build commands/queries inline, with a local `buildCommand` helper for overrides:

```typescript
const baseCommand = makePilotProductCreationCommand({
  data: {
    label: 'Test Product',
    type: 'TAPIS',
    category: 'STANDARD',
    description: 'A test product',
    priceRange: 'STANDARD',
    variants: [{ size: 'REGULAR' }],
    views: [
      { viewType: 'FRONT', imageUrl: 'https://example.com/front.jpg' },
      { viewType: 'DETAIL', imageUrl: 'https://example.com/detail.jpg' },
    ],
    status: 'DRAFT',
  },
  correlationId: makeCorrelationId('test-corr-1'),
  userId: makeUserId('test-user-1'),
  timestamp: TEST_DATE,
})

const buildCommand = (overrides = {}) => ({
  ...baseCommand,
  data: { ...baseCommand.data, ...overrides },
})
```

### Running Handler with Layer

```typescript
it('should create a product', async () => {
  const result = await pipe(pilotProductCreationHandler(baseCommand), provide(layer), runPromise)

  expect(result._tag).toBe('PilotProduct')
  expect(result.label).toBe('Test Product')
  expect(result.id).toBe('test-product-1') // deterministic
  expect(result.createdAt).toEqual(TEST_DATE) // fixed clock
})
```

### Testing Validation Errors

```typescript
it('should fail with ValidationError for invalid data', async () => {
  const invalidCommand = buildCommand({ label: '' })

  const result = await pipe(
    pilotProductCreationHandler(invalidCommand),
    provide(layer),
    Effect.either,
    runPromise
  )

  expect(Either.isLeft(result)).toBe(true)
  if (Either.isLeft(result)) {
    expect(result.left._tag).toBe('ValidationError')
  }
})
```

### Testing Event Emission

```typescript
it('should emit PilotProductPublished when product is published', async () => {
  const command = buildCommand({ status: 'PUBLISHED' })

  await pipe(pilotProductCreationHandler(command), provide(layer), runPromise)

  expect(eventSpy.hasEmitted('PilotProductPublished')).toBe(true)
  expect(eventSpy.lastEvent?._version).toBe(1)
})

it('should NOT emit event for draft product', async () => {
  await pipe(
    pilotProductCreationHandler(baseCommand), // status: DRAFT
    provide(layer),
    runPromise
  )

  expect(eventSpy.emittedEvents).toHaveLength(0)
})
```

### Testing Domain (pure, no Layer)

```typescript
describe('publish', () => {
  it('should transition DRAFT → PUBLISHED', async () => {
    const product = makePilotProduct({ ...draftProduct })
    const result = await runPromise(publish(product, new Date()))
    expect(result.status).toBe('PUBLISHED')
  })

  it('should fail for already archived product', async () => {
    const product = makePilotProduct({ ...archivedProduct })
    const result = await pipe(publish(product, new Date()), Effect.either, runPromise)
    expect(Either.isLeft(result)).toBe(true)
  })
})
```

### Test Organization

```
describe('handlerName', () => {
  // Setup
  const { layer, eventSpy } = provideTestLayer()
  afterEach(() => eventSpy.clear())

  // 1. Success cases
  describe('success cases', () => { ... })

  // 2. Event emission
  describe('event emission', () => { ... })

  // 3. Validation errors
  describe('validation errors', () => { ... })

  // 4. Edge cases
  describe('edge cases', () => { ... })
})
```

## Test Doubles

| Double                               | Type | Behavior                                                              |
| ------------------------------------ | ---- | --------------------------------------------------------------------- |
| `StubClockLive`                      | Stub | Returns fixed `TEST_DATE`                                             |
| `StubIdGeneratorLive`                | Stub | Returns `test-product-1`, `test-product-2`, ...                       |
| `SpyEventPublisherLive`              | Spy  | Captures events, exposes `emittedEvents`, `lastEvent`, `hasEmitted()` |
| `InMemoryPilotProductRepositoryLive` | Fake | Full in-memory Map-based implementation                               |

## Reference Files

| Pattern                 | File                                                                              |
| ----------------------- | --------------------------------------------------------------------------------- |
| Test layer              | `apps/server/src/test-utils/test-layer.ts`                                        |
| Fixed clock             | `apps/server/src/test-utils/fixed-clock.ts`                                       |
| Deterministic ID gen    | `apps/server/src/test-utils/deterministic-id-generator.ts`                        |
| Spy event publisher     | `apps/server/src/test-utils/spy-event-publisher.ts`                               |
| Handler test (create)   | `apps/server/src/application/pilot/handlers/create-pilot-product.handler.test.ts` |
| Handler test (update)   | `apps/server/src/application/pilot/handlers/update-pilot-product.handler.test.ts` |
| Handler test (query)    | `apps/server/src/application/pilot/handlers/get-pilot-product.handler.test.ts`    |
| Domain test (aggregate) | `apps/server/src/domain/pilot/aggregate.test.ts`                                  |
| Domain test (service)   | `apps/server/src/domain/pilot/services/sync-status.machine.test.ts`               |
| Validation test         | `apps/server/src/application/pilot/validation/variant-input.schema.test.ts`       |

## Quality Checklist

- [ ] `provideTestLayer()` used for handler tests
- [ ] `eventSpy` used to verify event emission
- [ ] `_version` checked in emitted events
- [ ] Selective Effect imports
- [ ] Inline fixtures (no separate fixture files)
- [ ] Organized in sections (success, events, errors, edge cases)
- [ ] `afterEach(() => eventSpy.clear())`
- [ ] Deterministic assertions (fixed IDs, fixed dates)
