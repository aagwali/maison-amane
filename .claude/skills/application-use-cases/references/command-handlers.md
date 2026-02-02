# Command Handlers

## Pattern complet

```typescript
// application/{context}/handlers/create-{entity}.handler.ts
import { Effect } from 'effect'

import {
  Make{Entity},
  MakeNotSynced,
  Make{Entity}Published,
  type {Entity},
  {Entity}Status,
} from '../../../domain/{context}'
import { Clock, EventPublisher, IdGenerator, {Entity}Repository } from '../../../ports/driven'
import { validateProductData } from '../validation'
import type { Create{Entity}Command } from '../commands'

// =============================================================================
// HANDLER PRINCIPAL
// =============================================================================

export const handleCreate{Entity} = (
  command: Create{Entity}Command
): Effect.Effect<
  {Entity},                           // Retour succès
  {Entity}ValidationError,            // Union des erreurs
  {Entity}Repository | IdGenerator | EventPublisher | Clock  // Dépendances
> =>
  Effect.gen(function* () {
    // 1. VALIDATION
    const validated = yield* validateProductData(command.data)

    // 2. CRÉATION AGGREGATE
    const entity = yield* createAggregate(validated)

    // 3. PERSISTANCE
    const repo = yield* {Entity}Repository
    const saved = yield* repo.save(entity)

    // 4. ÉMISSION EVENT (conditionnel)
    if (saved.status === {Entity}Status.PUBLISHED) {
      yield* emitEvent(saved, command)
    }

    return saved
  })

// =============================================================================
// HELPERS PRIVÉS
// =============================================================================

const createAggregate = (
  validated: Validated{Entity}Data
): Effect.Effect<{Entity}, never, IdGenerator | Clock> =>
  Effect.gen(function* () {
    const idGen = yield* IdGenerator
    const clock = yield* Clock

    const id = yield* idGen.generate{Entity}Id()
    const now = yield* clock.now()

    return Make{Entity}({
      id,
      // Map validated fields
      createdAt: now,
      updatedAt: now,
    })
  })

const emitEvent = (
  entity: {Entity},
  command: Create{Entity}Command
): Effect.Effect<void, never, EventPublisher | Clock> =>
  Effect.gen(function* () {
    const publisher = yield* EventPublisher
    const clock = yield* Clock
    const now = yield* clock.now()

    const event = Make{Entity}Published({
      entityId: entity.id,
      entity,
      correlationId: command.correlationId,
      userId: command.userId,
      timestamp: now,
    })

    // Log error mais ne fait pas échouer la commande
    yield* publisher.publish(event).pipe(
      Effect.catchAll((error) =>
        Effect.logError('Failed to publish event').pipe(
          Effect.annotateLogs({ error: String(error) })
        )
      )
    )
  })
```

## Command DTO

```typescript
// application/{context}/commands/create-{entity}.command.ts
import { Data } from 'effect'
import * as S from 'effect/Schema'
import { CorrelationIdSchema, UserIdSchema } from '@maison-amane/shared-kernel'

// Input non validé (from API)
export const Unvalidated{Entity}DataSchema = S.Struct({
  label: S.String,
  status: S.String,
  // ... autres champs bruts
})

export type Unvalidated{Entity}Data = typeof Unvalidated{Entity}DataSchema.Type

// Command avec metadata
export const Create{Entity}CommandSchema = S.TaggedStruct('Create{Entity}Command', {
  data: Unvalidated{Entity}DataSchema,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type Create{Entity}Command = typeof Create{Entity}CommandSchema.Type

export const MakeCreate{Entity}Command = (
  params: Omit<Create{Entity}Command, '_tag'>
): Create{Entity}Command =>
  Data.case<Create{Entity}Command>()({ _tag: 'Create{Entity}Command', ...params })
```

## Update Handler (fetch + modify + save)

```typescript
export const handleUpdate{Entity} = (
  command: Update{Entity}Command
): Effect.Effect<
  {Entity},
  {Entity}NotFound | {Entity}ValidationError,
  {Entity}Repository | Clock
> =>
  Effect.gen(function* () {
    const repo = yield* {Entity}Repository
    const clock = yield* Clock

    // 1. Fetch existing
    const maybeEntity = yield* repo.findById(command.entityId)
    const entity = yield* Option.match(maybeEntity, {
      onNone: () => Effect.fail(new {Entity}NotFound({ id: String(command.entityId) })),
      onSome: Effect.succeed,
    })

    // 2. Validate update data
    const validated = yield* validateUpdateData(command.data)

    // 3. Apply changes (immutable)
    const now = yield* clock.now()
    const updated = {
      ...entity,
      ...validated,
      updatedAt: now,
    }

    // 4. Persist
    return yield* repo.update(updated)
  })
```

## Signature de type

La signature du handler documente tout :

```typescript
Effect.Effect<
  ReturnType, // Ce que le handler retourne en cas de succès
  ErrorUnion, // Toutes les erreurs possibles (union)
  Dependencies // Services injectés via Context.Tag
>
```

## Checklist

- [ ] Signature de type explicite (retour, erreurs, dépendances)
- [ ] Validation via Effect Schema avant logique métier
- [ ] Dépendances injectées via `yield*` (pas d'import direct)
- [ ] Helpers privés pour lisibilité
- [ ] Event émis après persistance réussie
- [ ] Logging avec `Effect.annotateLogs` pour contexte
- [ ] Tests d'intégration avec TestLayer
