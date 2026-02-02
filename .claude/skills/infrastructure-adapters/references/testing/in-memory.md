# In-Memory Repository

Pour les tests d'intégration.

## Generic Repository

```typescript
// infrastructure/persistence/in-memory/generic.repository.ts
import { Effect, Option } from 'effect'
import { PersistenceError } from '../../../ports/driven/errors'

export interface InMemoryRepository<T, Id extends string> {
  readonly save: (entity: T) => Effect.Effect<T, PersistenceError>
  readonly findById: (id: Id) => Effect.Effect<Option.Option<T>, PersistenceError>
  readonly findAll: () => Effect.Effect<readonly T[], PersistenceError>
  readonly update: (entity: T) => Effect.Effect<T, PersistenceError>
  readonly upsert: (entity: T) => Effect.Effect<T, PersistenceError>
  readonly delete: (id: Id) => Effect.Effect<void, PersistenceError>
}

export const createInMemoryRepository = <T, Id extends string>(
  getId: (entity: T) => Id
): InMemoryRepository<T, Id> => {
  const store = new Map<Id, T>()

  return {
    save: (entity) =>
      Effect.try({
        try: () => {
          store.set(getId(entity), entity)
          return entity
        },
        catch: (error) =>
          new PersistenceError({ operation: 'insert', entity: 'unknown', cause: error }),
      }),

    findById: (id) => Effect.succeed(Option.fromNullable(store.get(id))),

    findAll: () => Effect.succeed(Array.from(store.values())),

    update: (entity) =>
      Effect.try({
        try: () => {
          store.set(getId(entity), entity)
          return entity
        },
        catch: (error) =>
          new PersistenceError({ operation: 'update', entity: 'unknown', cause: error }),
      }),

    upsert: (entity) =>
      Effect.try({
        try: () => {
          store.set(getId(entity), entity)
          return entity
        },
        catch: (error) =>
          new PersistenceError({ operation: 'update', entity: 'unknown', cause: error }),
      }),

    delete: (id) =>
      Effect.try({
        try: () => {
          store.delete(id)
        },
        catch: (error) =>
          new PersistenceError({ operation: 'delete', entity: 'unknown', cause: error }),
      }),
  }
}
```

## Repository spécifique

```typescript
// infrastructure/persistence/in-memory/{entity}.repository.ts
import { Layer } from 'effect'

import { {Entity}Repository } from '../../../ports/driven'
import type { {Entity}, {Entity}Id } from '../../../domain/{context}'
import { createInMemoryRepository } from './generic.repository'

export const InMemory{Entity}RepositoryLive = Layer.succeed(
  {Entity}Repository,
  createInMemoryRepository<{Entity}, {Entity}Id>((entity) => entity.id)
)
```

## Utilisation avec Effect Ref (isolation par test)

Pour une isolation complète entre tests :

```typescript
// Alternative avec Ref pour reset entre tests
import { Effect, Layer, Ref } from 'effect'

export const createInMemoryRepositoryWithRef = <T, Id extends string>(
  getId: (entity: T) => Id
): Effect.Effect<InMemoryRepository<T, Id>> =>
  Effect.gen(function* () {
    const storeRef = yield* Ref.make(new Map<Id, T>())

    return {
      save: (entity) =>
        Ref.update(storeRef, (store) => {
          const newStore = new Map(store)
          newStore.set(getId(entity), entity)
          return newStore
        }).pipe(Effect.map(() => entity)),

      findById: (id) =>
        Ref.get(storeRef).pipe(Effect.map((store) => Option.fromNullable(store.get(id)))),

      // ... autres méthodes
    }
  })
```

## Avantages

| Aspect           | In-Memory  | MongoDB           |
| ---------------- | ---------- | ----------------- |
| **Vitesse**      | Instantané | Réseau            |
| **Setup**        | Aucun      | Docker/Atlas      |
| **Isolation**    | Par test   | Cleanup requis    |
| **Déterminisme** | Total      | Dépend de l'ordre |

## Checklist

- [ ] `Layer.succeed` (pas de dépendances)
- [ ] Même interface que le repository MongoDB
- [ ] Generic repository réutilisable
- [ ] `getId` fonction passée au factory
- [ ] Utilisé dans `TestLayer` pour tests handlers
