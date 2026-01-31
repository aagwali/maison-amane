---
name: infra-adapter-hexa
description: Implémente repositories et adapters pour l'architecture hexagonale. Utiliser pour connecter le domaine aux systèmes externes (MongoDB, RabbitMQ, API).
---

# Infrastructure Adapter (Hexagonal)

## Quand utiliser ce skill

- "Implémenter le repository pour [entity] avec MongoDB"
- "Créer un adapter pour [service externe]"
- "Ajouter un publisher pour les events [context]"
- "Créer un client pour l'API [nom]"

## Contexte nécessaire

1. **Type d'adapter** : Repository, Service externe, Publisher, Consumer
2. **Technologie** : MongoDB, RabbitMQ, HTTP API, etc.
3. **Port correspondant** : interface dans `ports/driven/`
4. **Mapping** : transformations domain ↔ infrastructure

## Workflow

### 1. Analyse

- Identifier le port (interface) à implémenter
- Définir le format de persistance/communication
- Lister les opérations CRUD ou méthodes nécessaires
- Prévoir les mappers domain ↔ infra

### 2. Génération

Créer les fichiers :

1. Mapper (domain ↔ document/DTO externe)
2. Implémentation du service
3. Layer Effect pour l'injection

### 3. Validation

- [ ] Implémente exactement l'interface du port
- [ ] Erreurs mappées vers `PersistenceError` ou erreur typée
- [ ] Layer exporté pour composition
- [ ] Mappers testables séparément

## Patterns techniques

### Pattern 1 : Port Repository (Interface)

```typescript
// ports/driven/repositories/{entity}.repository.ts
import { Context, Effect, Option } from 'effect'

import type { ProductId, PilotProduct } from '../../../domain/pilot'
import type { PersistenceError } from '../errors'

// Interface du service
export interface PilotProductRepositoryService {
  readonly save: (product: PilotProduct) => Effect.Effect<PilotProduct, PersistenceError>

  readonly findById: (id: ProductId) => Effect.Effect<Option.Option<PilotProduct>, PersistenceError>

  readonly update: (product: PilotProduct) => Effect.Effect<PilotProduct, PersistenceError>

  readonly delete: (id: ProductId) => Effect.Effect<void, PersistenceError>
}

// Context.Tag pour l'injection de dépendances
export class PilotProductRepository extends Context.Tag('PilotProductRepository')<
  PilotProductRepository,
  PilotProductRepositoryService
>() {}
```

### Pattern 2 : Erreurs d'infrastructure

```typescript
// ports/driven/errors.ts
import { Data } from 'effect'

export class PersistenceError extends Data.TaggedError('PersistenceError')<{
  readonly operation: 'insert' | 'find' | 'update' | 'delete'
  readonly entity: string
  readonly cause: unknown
}> {}

export class ConnectionError extends Data.TaggedError('ConnectionError')<{
  readonly service: string
  readonly cause: unknown
}> {}

export class ExternalApiError extends Data.TaggedError('ExternalApiError')<{
  readonly api: string
  readonly statusCode?: number
  readonly message: string
  readonly cause?: unknown
}> {}
```

### Pattern 3 : Mapper Domain ↔ Document

```typescript
// infrastructure/persistence/mongodb/mappers/{entity}.mapper.ts
import type { PilotProduct, ProductVariant } from '../../../../domain/pilot'

// Document MongoDB (format de stockage)
export interface PilotProductDocument {
  _id: string
  label: string
  type: string
  category: string
  description: string
  priceRange: string
  variants: VariantDocument[]
  views: ViewsDocument
  status: string
  syncStatus: SyncStatusDocument
  createdAt: Date
  updatedAt: Date
}

// Domain → Document
export const toDocument = (product: PilotProduct): PilotProductDocument => ({
  _id: product.id,
  label: product.label,
  type: product.type,
  category: product.category,
  description: product.description,
  priceRange: product.priceRange,
  variants: product.variants.map(variantToDocument),
  views: viewsToDocument(product.views),
  status: product.status,
  syncStatus: syncStatusToDocument(product.syncStatus),
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
})

// Document → Domain
export const fromDocument = (doc: PilotProductDocument): PilotProduct =>
  MakePilotProduct({
    id: MakeProductId(doc._id),
    label: doc.label,
    type: doc.type as ProductType,
    category: doc.category as ProductCategory,
    description: doc.description,
    priceRange: doc.priceRange as PriceRange,
    variants: doc.variants.map(variantFromDocument) as [ProductVariant, ...ProductVariant[]],
    views: viewsFromDocument(doc.views),
    status: doc.status as ProductStatus,
    syncStatus: syncStatusFromDocument(doc.syncStatus),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  })
```

### Pattern 4 : Repository MongoDB

```typescript
// infrastructure/persistence/mongodb/{entity}.repository.ts
import { Effect, Layer, Option } from 'effect'
import type { Collection, Db } from 'mongodb'

import { PilotProductRepository as PilotProductRepositoryTag } from '../../../ports/driven'
import { PersistenceError } from '../../../ports/driven/errors'
import { fromDocument, toDocument, type PilotProductDocument } from './mappers'
import { MongoDatabase } from './mongo-database'

import type { PilotProductRepositoryService } from '../../../ports/driven'

const COLLECTION_NAME = 'pilot_products'

// Factory function
export const createMongodbPilotProductRepository = (db: Db): PilotProductRepositoryService => {
  const collection: Collection<PilotProductDocument> = db.collection(COLLECTION_NAME)

  return {
    save: (product) => {
      const doc = toDocument(product)
      return Effect.tryPromise({
        try: () => collection.insertOne(doc as any),
        catch: (error) =>
          new PersistenceError({
            operation: 'insert',
            entity: 'PilotProduct',
            cause: error,
          }),
      }).pipe(Effect.map(() => product))
    },

    findById: (id) =>
      Effect.tryPromise({
        try: () => collection.findOne({ _id: id }),
        catch: (error) =>
          new PersistenceError({
            operation: 'find',
            entity: 'PilotProduct',
            cause: error,
          }),
      }).pipe(Effect.map((doc) => (doc ? Option.some(fromDocument(doc)) : Option.none()))),

    update: (product) => {
      const doc = toDocument(product)
      return Effect.tryPromise({
        try: () => collection.replaceOne({ _id: product.id }, doc as any),
        catch: (error) =>
          new PersistenceError({
            operation: 'update',
            entity: 'PilotProduct',
            cause: error,
          }),
      }).pipe(Effect.map(() => product))
    },

    delete: (id) =>
      Effect.tryPromise({
        try: () => collection.deleteOne({ _id: id }),
        catch: (error) =>
          new PersistenceError({
            operation: 'delete',
            entity: 'PilotProduct',
            cause: error,
          }),
      }).pipe(Effect.map(() => void 0)),
  }
}

// Layer Effect pour l'injection
export const MongodbPilotProductRepositoryLive = Layer.effect(
  PilotProductRepositoryTag,
  Effect.map(MongoDatabase, (db) => createMongodbPilotProductRepository(db))
)
```

### Pattern 5 : Base Repository (helpers réutilisables)

```typescript
// infrastructure/persistence/mongodb/base-repository.ts
import { Effect, Option } from 'effect'
import type { Collection, Document, WithId } from 'mongodb'

import { PersistenceError } from '../../../ports/driven/errors'

export const insertDocument = <TDoc extends Document, TDomain>(
  collection: Collection<TDoc>,
  doc: TDoc,
  domain: TDomain
): Effect.Effect<TDomain, PersistenceError> =>
  Effect.tryPromise({
    try: () => collection.insertOne(doc as any),
    catch: (error) =>
      new PersistenceError({
        operation: 'insert',
        entity: collection.collectionName,
        cause: error,
      }),
  }).pipe(Effect.map(() => domain))

export const findDocumentById = <TDoc extends Document, TDomain>(
  collection: Collection<TDoc>,
  id: string,
  fromDocument: (doc: WithId<TDoc>) => TDomain
): Effect.Effect<Option.Option<TDomain>, PersistenceError> =>
  Effect.tryPromise({
    try: () => collection.findOne({ _id: id } as any),
    catch: (error) =>
      new PersistenceError({
        operation: 'find',
        entity: collection.collectionName,
        cause: error,
      }),
  }).pipe(
    Effect.map((doc) => (doc ? Option.some(fromDocument(doc as WithId<TDoc>)) : Option.none()))
  )
```

### Pattern 6 : Service externe (Clock, IdGenerator)

```typescript
// ports/driven/services/clock.ts
import { Context, Effect } from 'effect'

export interface ClockService {
  readonly now: () => Effect.Effect<Date>
}

export class Clock extends Context.Tag('Clock')<Clock, ClockService>() {}

// infrastructure/services/system-clock.ts
import { Layer } from 'effect'
import { Clock } from '../../ports/driven'

export const SystemClockLive = Layer.succeed(Clock, {
  now: () => Effect.succeed(new Date()),
})
```

```typescript
// ports/driven/services/id-generator.ts
import { Context, Effect } from 'effect'
import type { ProductId, CorrelationId } from '../../../domain'

export interface IdGeneratorService {
  readonly generateProductId: () => Effect.Effect<ProductId>
  readonly generateCorrelationId: () => Effect.Effect<string>
}

export class IdGenerator extends Context.Tag('IdGenerator')<IdGenerator, IdGeneratorService>() {}

// infrastructure/services/uuid-id-generator.ts
import { Effect, Layer } from 'effect'
import { randomUUID } from 'crypto'
import { IdGenerator } from '../../ports/driven'
import { MakeProductId } from '../../domain/pilot'

export const UuidIdGeneratorLive = Layer.succeed(IdGenerator, {
  generateProductId: () => Effect.succeed(MakeProductId(randomUUID())),
  generateCorrelationId: () => Effect.succeed(randomUUID()),
})
```

### Pattern 7 : Event Publisher (RabbitMQ)

```typescript
// ports/driven/services/event-publisher.ts
import { Context, Effect } from 'effect'
import type { PilotDomainEvent } from '../../../domain/pilot'

export interface EventPublisherService {
  readonly publish: (event: PilotDomainEvent) => Effect.Effect<void, PublishError>
}

export class EventPublisher extends Context.Tag('EventPublisher')<
  EventPublisher,
  EventPublisherService
>() {}

// infrastructure/messaging/rabbitmq/event-publisher.ts
import { Effect, Layer } from 'effect'
import { EventPublisher } from '../../../ports/driven'
import { RabbitMQConnection } from './connection'

const EXCHANGE_NAME = 'pilot_events'

export const RabbitMQEventPublisherLive = Layer.effect(
  EventPublisher,
  Effect.map(RabbitMQConnection, (channel) => ({
    publish: (event) =>
      Effect.tryPromise({
        try: async () => {
          const routingKey = `pilot.${event._tag.toLowerCase()}`
          const message = JSON.stringify(event)
          channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(message), {
            persistent: true,
            contentType: 'application/json',
          })
        },
        catch: (error) =>
          new PublishError({
            event: event._tag,
            cause: error,
          }),
      }),
  }))
)
```

### Pattern 8 : In-Memory Repository (Tests)

```typescript
// infrastructure/persistence/in-memory/{entity}.repository.ts
import { Effect, Layer, Option, Ref } from 'effect'

import { PilotProductRepository as PilotProductRepositoryTag } from '../../../ports/driven'
import type { PilotProduct, ProductId } from '../../../domain/pilot'
import type { PilotProductRepositoryService } from '../../../ports/driven'

export const createInMemoryPilotProductRepository = (): Effect.Effect<
  PilotProductRepositoryService,
  never,
  never
> =>
  Effect.gen(function* () {
    const store = yield* Ref.make<Map<string, PilotProduct>>(new Map())

    return {
      save: (product) =>
        Ref.update(store, (map) => new Map(map).set(product.id, product)).pipe(
          Effect.map(() => product)
        ),

      findById: (id) => Ref.get(store).pipe(Effect.map((map) => Option.fromNullable(map.get(id)))),

      update: (product) =>
        Ref.update(store, (map) => new Map(map).set(product.id, product)).pipe(
          Effect.map(() => product)
        ),

      delete: (id) =>
        Ref.update(store, (map) => {
          const newMap = new Map(map)
          newMap.delete(id)
          return newMap
        }),
    }
  })

export const InMemoryPilotProductRepositoryLive = Layer.effect(
  PilotProductRepositoryTag,
  createInMemoryPilotProductRepository()
)
```

### Pattern 9 : Layer Composition

```typescript
// composition/layers/development.layer.ts
import { Layer } from 'effect'

import { MongodbPilotProductRepositoryLive } from '../../infrastructure/persistence/mongodb'
import { RabbitMQEventPublisherLive } from '../../infrastructure/messaging/rabbitmq'
import { UuidIdGeneratorLive } from '../../infrastructure/services/uuid-id-generator'
import { SystemClockLive } from '../../infrastructure/services/system-clock'
import { MongoDatabaseLive } from '../../infrastructure/persistence/mongodb/mongo-database'
import { RabbitMQConnectionLive } from '../../infrastructure/messaging/rabbitmq/connection'

// Composition des layers avec leurs dépendances
const PilotProductLayer = MongodbPilotProductRepositoryLive.pipe(Layer.provide(MongoDatabaseLive))

const RabbitMQPublisherLayer = RabbitMQEventPublisherLive.pipe(
  Layer.provide(RabbitMQConnectionLive)
)

// Layer final
export const DevelopmentLayer = Layer.mergeAll(
  PilotProductLayer,
  UuidIdGeneratorLive,
  SystemClockLive,
  RabbitMQPublisherLayer
)
```

## Structure de fichiers générée

```
infrastructure/
├── persistence/
│   ├── mongodb/
│   │   ├── mongo-database.ts         # Context.Tag pour Db
│   │   ├── base-repository.ts        # Helpers CRUD génériques
│   │   ├── {entity}.repository.ts    # Implémentation spécifique
│   │   ├── mappers/
│   │   │   ├── {entity}.mapper.ts    # domain ↔ document
│   │   │   └── index.ts
│   │   └── index.ts
│   └── in-memory/
│       ├── {entity}.repository.ts    # Pour tests
│       └── index.ts
├── messaging/
│   └── rabbitmq/
│       ├── connection.ts             # Context.Tag pour Channel
│       ├── topology.ts               # Setup exchanges/queues
│       ├── event-publisher.ts        # Adapter publish
│       └── index.ts
├── services/
│   ├── system-clock.ts               # Clock adapter
│   ├── uuid-id-generator.ts          # IdGenerator adapter
│   └── index.ts
└── http/
    ├── handlers/
    │   └── {entity}.handler.ts       # HTTP route handler
    └── mappers/
        └── error.mapper.ts           # Error → HTTP response
```

## Checklist de qualité

- [ ] Interface définie dans `ports/driven/`
- [ ] Erreurs typées (`PersistenceError`, `ExternalApiError`)
- [ ] Mappers domain ↔ infra séparés et testables
- [ ] Layer Effect exporté pour injection
- [ ] In-memory repository disponible pour tests
- [ ] Configuration externalisée (env vars via Config)
- [ ] Logs avec annotations pour debug
- [ ] Retry/timeout si service externe
