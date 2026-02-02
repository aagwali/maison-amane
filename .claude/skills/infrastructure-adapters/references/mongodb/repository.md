# MongoDB Repository

## Pattern complet

```typescript
// infrastructure/persistence/mongodb/{entity}.repository.ts
import { Effect, Layer, Option } from 'effect'
import type { Collection } from 'mongodb'

import { {Entity}Repository } from '../../../ports/driven'
import type { {Entity}RepositoryService } from '../../../ports/driven'
import { MongoDatabase } from './mongo-database'
import {
  {camelEntity}FromDocument,
  {camelEntity}ToDocument,
  type {Entity}Document,
} from './mappers/{kebab-entity}.mapper'
import { tryMongoOperation } from './base-repository'

const COLLECTION_NAME = '{snake_entity}s'

// =============================================================================
// FACTORY
// =============================================================================

const createMongodb{Entity}Repository = (
  collection: Collection<{Entity}Document>
): {Entity}RepositoryService => ({
  save: ({camelEntity}) =>
    tryMongoOperation(
      () => collection.insertOne({camelEntity}ToDocument({camelEntity}) as any),
      'insert',
      '{Entity}'
    ).pipe(Effect.map(() => {camelEntity})),

  findById: (id) =>
    tryMongoOperation(
      () => collection.findOne({ _id: id }),
      'find',
      '{Entity}'
    ).pipe(
      Effect.map((doc) =>
        doc ? Option.some({camelEntity}FromDocument(doc)) : Option.none()
      )
    ),

  update: ({camelEntity}) =>
    tryMongoOperation(
      () => collection.replaceOne(
        { _id: {camelEntity}.id },
        {camelEntity}ToDocument({camelEntity}) as any
      ),
      'update',
      '{Entity}'
    ).pipe(Effect.map(() => {camelEntity})),

  delete: (id) =>
    tryMongoOperation(
      () => collection.deleteOne({ _id: id }),
      'delete',
      '{Entity}'
    ).pipe(Effect.map(() => void 0)),
})

// =============================================================================
// LAYER
// =============================================================================

export const Mongodb{Entity}RepositoryLive = Layer.effect(
  {Entity}Repository,
  Effect.map(MongoDatabase, (db) =>
    createMongodb{Entity}Repository(db.collection(COLLECTION_NAME))
  )
)
```

## Base Repository Helpers

```typescript
// infrastructure/persistence/mongodb/base-repository.ts
import { Effect } from 'effect'
import { PersistenceError } from '../../../ports/driven/errors'

export const tryMongoOperation = <T>(
  operation: () => Promise<T>,
  opType: 'insert' | 'find' | 'update' | 'delete',
  entity: string
): Effect.Effect<T, PersistenceError> =>
  Effect.tryPromise({
    try: operation,
    catch: (error) =>
      new PersistenceError({
        operation: opType,
        entity,
        cause: error,
      }),
  })

export const upsertDocument = <TDoc>(
  collection: Collection<TDoc>,
  id: string,
  doc: TDoc,
  entity: string
): Effect.Effect<void, PersistenceError> =>
  tryMongoOperation(
    () => collection.updateOne({ _id: id } as any, { $set: doc as any }, { upsert: true }),
    'update',
    entity
  ).pipe(Effect.map(() => void 0))
```

## MongoDatabase Context.Tag

```typescript
// infrastructure/persistence/mongodb/mongo-database.ts
import { Context, Effect, Layer } from 'effect'
import { MongoClient, type Db } from 'mongodb'

export class MongoDatabase extends Context.Tag('MongoDatabase')<MongoDatabase, Db>() {}

export const MongoDatabaseLive = Layer.scoped(
  MongoDatabase,
  Effect.acquireRelease(
    Effect.gen(function* () {
      const config = yield* MongoConfig
      const client = new MongoClient(config.uri)
      yield* Effect.tryPromise(() => client.connect())
      return client.db(config.database)
    }),
    (db) => Effect.tryPromise(() => db.client.close()).pipe(Effect.catchAll(() => Effect.void))
  )
)
```

## Opérations avancées

### Find All

```typescript
findAll: () =>
  tryMongoOperation(
    () => collection.find({}).toArray(),
    'find',
    '{Entity}'
  ).pipe(
    Effect.map((docs) => docs.map({camelEntity}FromDocument))
  ),
```

### Search avec filtres

```typescript
search: (query: SearchQuery) =>
  tryMongoOperation(
    () => collection
      .find(buildFilter(query))
      .skip(query.offset ?? 0)
      .limit(query.limit ?? 50)
      .toArray(),
    'find',
    '{Entity}'
  ).pipe(
    Effect.map((docs) => docs.map({camelEntity}FromDocument))
  ),
```

### Upsert

```typescript
upsert: ({camelEntity}) =>
  tryMongoOperation(
    () => collection.updateOne(
      { _id: {camelEntity}.id },
      { $set: {camelEntity}ToDocument({camelEntity}) as any },
      { upsert: true }
    ),
    'update',
    '{Entity}'
  ).pipe(Effect.map(() => {camelEntity})),
```

## Checklist

- [ ] Factory function `createMongodb{Entity}Repository`
- [ ] `Layer.effect` avec dépendance `MongoDatabase`
- [ ] Utiliser `tryMongoOperation` pour error handling
- [ ] Mappers importés depuis `./mappers/`
- [ ] Collection name en snake_case pluriel
- [ ] Option.none() pour findById sans résultat
