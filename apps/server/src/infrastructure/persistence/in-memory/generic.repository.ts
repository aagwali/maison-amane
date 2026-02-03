// src/infrastructure/persistence/in-memory/generic.repository.ts

import { Effect, Option } from 'effect'

import { PersistenceError } from '../../../ports/driven'

// ============================================
// GENERIC IN-MEMORY REPOSITORY
// ============================================

export interface InMemoryRepository<T, Id extends string> {
  readonly save: (entity: T) => Effect.Effect<T, PersistenceError>
  readonly findById: (id: Id) => Effect.Effect<Option.Option<T>, PersistenceError>
  readonly update: (entity: T) => Effect.Effect<T, PersistenceError>
  readonly upsert: (entity: T) => Effect.Effect<T, PersistenceError>
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
        catch: (error) => new PersistenceError({ cause: error }),
      }),

    findById: (id) =>
      Effect.try({
        try: () => {
          const entity = store.get(id)
          return entity ? Option.some(entity) : Option.none()
        },
        catch: (error) => new PersistenceError({ cause: error }),
      }),

    update: (entity) =>
      Effect.try({
        try: () => {
          store.set(getId(entity), entity)
          return entity
        },
        catch: (error) => new PersistenceError({ cause: error }),
      }),

    upsert: (entity) =>
      Effect.try({
        try: () => {
          store.set(getId(entity), entity)
          return entity
        },
        catch: (error) => new PersistenceError({ cause: error }),
      }),
  }
}
