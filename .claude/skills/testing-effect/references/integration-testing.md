# Tests d'intégration

## Structure de test handler

```typescript
// application/{context}/handlers/{handler}.handler.test.ts
import { Effect } from 'effect'
import { beforeEach, describe, expect, it } from 'vitest'

import { provideTestLayer, type TestContext, TEST_DATE } from '../../../test-utils'
import { MakeCreate{Entity}Command } from '../commands'
import { handleCreate{Entity} } from './create-{entity}.handler'

describe('handleCreate{Entity}', () => {
  let testCtx: TestContext

  // ==========================================================================
  // SETUP - Nouvel état isolé par test
  // ==========================================================================

  beforeEach(() => {
    testCtx = provideTestLayer()
  })

  // ==========================================================================
  // SUCCESS CASES
  // ==========================================================================

  describe('success cases', () => {
    it('creates {entity} with deterministic ID', async () => {
      const command = MakeCreate{Entity}Command({
        data: validData,
        correlationId: 'test-correlation' as any,
        userId: 'test-user' as any,
        timestamp: TEST_DATE,
      })

      const result = await Effect.runPromise(
        handleCreate{Entity}(command).pipe(Effect.provide(testCtx.layer))
      )

      expect(result.id).toBe('test-{entity}-1')
    })

    it('uses fixed clock for timestamps', async () => {
      const command = buildCommand()

      const result = await Effect.runPromise(
        handleCreate{Entity}(command).pipe(Effect.provide(testCtx.layer))
      )

      expect(result.createdAt).toEqual(TEST_DATE)
      expect(result.updatedAt).toEqual(TEST_DATE)
    })

    it('generates sequential IDs', async () => {
      const result1 = await Effect.runPromise(
        handleCreate{Entity}(buildCommand()).pipe(Effect.provide(testCtx.layer))
      )
      const result2 = await Effect.runPromise(
        handleCreate{Entity}(buildCommand()).pipe(Effect.provide(testCtx.layer))
      )

      expect(result1.id).toBe('test-{entity}-1')
      expect(result2.id).toBe('test-{entity}-2')
    })
  })

  // ==========================================================================
  // EVENT EMISSION
  // ==========================================================================

  describe('event emission', () => {
    it('emits event for published status', async () => {
      const command = buildCommand({ status: 'PUBLISHED' })

      await Effect.runPromise(
        handleCreate{Entity}(command).pipe(Effect.provide(testCtx.layer))
      )

      expect(testCtx.eventSpy.emittedEvents).toHaveLength(1)
      expect(testCtx.eventSpy.lastEvent?._tag).toBe('{Entity}Created')
    })

    it('does NOT emit event for draft status', async () => {
      const command = buildCommand({ status: 'DRAFT' })

      await Effect.runPromise(
        handleCreate{Entity}(command).pipe(Effect.provide(testCtx.layer))
      )

      expect(testCtx.eventSpy.emittedEvents).toHaveLength(0)
    })

    it('includes correct metadata in event', async () => {
      const command = buildCommand({
        status: 'PUBLISHED',
        correlationId: 'custom-correlation',
        userId: 'custom-user',
      })

      await Effect.runPromise(
        handleCreate{Entity}(command).pipe(Effect.provide(testCtx.layer))
      )

      const event = testCtx.eventSpy.lastEvent
      expect(event?.correlationId).toBe('custom-correlation')
      expect(event?.userId).toBe('custom-user')
      expect(event?.timestamp).toEqual(TEST_DATE)
    })
  })

  // ==========================================================================
  // ERROR CASES
  // ==========================================================================

  describe('error cases', () => {
    it('fails with ValidationError for empty label', async () => {
      const command = buildCommand({ label: '' })

      const result = await Effect.runPromise(
        handleCreate{Entity}(command).pipe(
          Effect.either,
          Effect.provide(testCtx.layer)
        )
      )

      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        expect(result.left._tag).toBe('ValidationError')
      }
    })
  })
})
```

## Pattern Either pour tester les erreurs

```typescript
// Capturer l'erreur sans throw
const result = await Effect.runPromise(
  handler(command).pipe(
    Effect.either, // Convertit Error en Left
    Effect.provide(testCtx.layer)
  )
)

// Assertions
expect(result._tag).toBe('Left') // C'est une erreur
if (result._tag === 'Left') {
  expect(result.left._tag).toBe('ValidationError')
  expect(result.left.field).toBe('label')
}
```

## Test d'update handler

```typescript
describe('handleUpdate{Entity}', () => {
  let testCtx: TestContext

  beforeEach(() => {
    testCtx = provideTestLayer()
  })

  it('updates existing {entity}', async () => {
    // 1. Create first
    const created = await Effect.runPromise(
      handleCreate{Entity}(createCommand).pipe(Effect.provide(testCtx.layer))
    )

    // 2. Update
    const updateCommand = buildUpdateCommand({
      {entity}Id: created.id,
      label: 'Updated Label',
    })

    const updated = await Effect.runPromise(
      handleUpdate{Entity}(updateCommand).pipe(Effect.provide(testCtx.layer))
    )

    expect(updated.label).toBe('Updated Label')
    expect(updated.id).toBe(created.id)
  })

  it('fails when {entity} not found', async () => {
    const command = buildUpdateCommand({ {entity}Id: 'non-existent' })

    const result = await Effect.runPromise(
      handleUpdate{Entity}(command).pipe(
        Effect.either,
        Effect.provide(testCtx.layer)
      )
    )

    expect(result._tag).toBe('Left')
    if (result._tag === 'Left') {
      expect(result.left._tag).toBe('{Entity}NotFound')
    }
  })
})
```

## Checklist

- [ ] `beforeEach` avec `provideTestLayer()` pour isolation
- [ ] Tests success cases avec assertions sur données
- [ ] Tests event emission avec spy
- [ ] Tests error cases avec `Effect.either`
- [ ] IDs déterministes vérifiés
- [ ] Timestamps fixes vérifiés
- [ ] Noms descriptifs : `it('does X when Y')`
