// src/infrastructure/persistence/in-memory/generic.repository.ts

import { Option } from 'effect'
import { type Effect, try as trySync } from 'effect/Effect'

import { PersistenceError } from '../../../ports/driven'

// ============================================
// GENERIC IN-MEMORY REPOSITORY
// ============================================

export interface InMemoryRepository<T, Id extends string> {
  readonly save: (entity: T) => Effect<T, PersistenceError>
  readonly findById: (id: Id) => Effect<Option.Option<T>, PersistenceError>
  readonly getById: <TError extends { readonly _tag: string }>(
    id: Id,
    notFoundError: (id: Id) => TError
  ) => Effect<T, PersistenceError | TError>
  readonly update: (entity: T) => Effect<T, PersistenceError>
  readonly upsert: (entity: T) => Effect<T, PersistenceError>
}

export const createInMemoryRepository = <T, Id extends string>(
  getId: (entity: T) => Id
): InMemoryRepository<T, Id> => {
  const store = new Map<Id, T>()

  return {
    save: (entity) =>
      trySync({
        try: () => {
          store.set(getId(entity), entity)
          return entity
        },
        catch: (error) => new PersistenceError({ cause: error }),
      }),

    findById: (id) =>
      trySync({
        try: () => {
          const entity = store.get(id)
          return entity ? Option.some(entity) : Option.none()
        },
        catch: (error) => new PersistenceError({ cause: error }),
      }),

    getById: (id, notFoundError) =>
      trySync({
        try: () => {
          const entity = store.get(id)
          if (!entity) {
            throw notFoundError(id)
          }
          return entity
        },
        catch: (error) => {
          // Preserve TaggedError, wrap others in PersistenceError
          if (error && typeof error === 'object' && '_tag' in error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return error as any
          }
          return new PersistenceError({ cause: error })
        },
      }),

    update: (entity) =>
      trySync({
        try: () => {
          store.set(getId(entity), entity)
          return entity
        },
        catch: (error) => new PersistenceError({ cause: error }),
      }),

    upsert: (entity) =>
      trySync({
        try: () => {
          store.set(getId(entity), entity)
          return entity
        },
        catch: (error) => new PersistenceError({ cause: error }),
      }),
  }
}
