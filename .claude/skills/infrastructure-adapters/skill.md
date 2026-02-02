---
name: infrastructure-adapters
description: |
  Implémente repositories et adapters pour l'architecture hexagonale avec Effect-TS.
  Utiliser quand: (1) Créer un repository MongoDB, (2) Implémenter un adapter RabbitMQ, (3) Créer un service externe, (4) Définir un port (Context.Tag), (5) Composer des layers.
  Patterns: Context.Tag, Layer.effect, Layer.succeed, mappers domain↔document.
---

# Infrastructure Adapters (Hexagonal)

## Génération rapide

```bash
# Générer repository complet (port + impl + mapper + in-memory)
python .claude/skills/ddd-feature-complete/scripts/generate_repository.py Order order
```

## Arbre de décision

```
Quel type d'adapter ?
│
├─ Persistance (CRUD)
│  ├─ MongoDB → references/mongodb/repository.md
│  └─ In-Memory (tests) → references/testing/in-memory.md
│
├─ Messaging
│  └─ RabbitMQ Publisher → references/rabbitmq/publisher.md
│
├─ Service externe (API)
│  └─ HTTP Client → references/external-service.md (TODO)
│
└─ Service technique (Clock, IdGenerator)
   └─ Layer.succeed simple → voir exemples ci-dessous
```

## Pattern Port (Interface)

```typescript
// ports/driven/repositories/{entity}.repository.ts
import { Context, Effect, Option } from 'effect'

export interface {Entity}RepositoryService {
  readonly save: (entity: {Entity}) => Effect.Effect<{Entity}, PersistenceError>
  readonly findById: (id: {Entity}Id) => Effect.Effect<Option.Option<{Entity}>, PersistenceError>
  readonly update: (entity: {Entity}) => Effect.Effect<{Entity}, PersistenceError>
}

export class {Entity}Repository extends Context.Tag('{Entity}Repository')<
  {Entity}Repository,
  {Entity}RepositoryService
>() {}
```

## Pattern Adapter (Layer.effect)

Pour adapters avec dépendances :

```typescript
// infrastructure/persistence/mongodb/{entity}.repository.ts
export const Mongodb{Entity}RepositoryLive = Layer.effect(
  {Entity}Repository,                    // Tag à fournir
  Effect.map(MongoDatabase, (db) =>      // Dépendance
    create{Entity}Repository(db.collection(COLLECTION))
  )
)
```

## Pattern Service simple (Layer.succeed)

Pour services sans dépendances :

```typescript
// infrastructure/services/system-clock.ts
export const SystemClockLive = Layer.succeed(Clock, {
  now: () => Effect.succeed(new Date()),
})

// infrastructure/services/uuid-id-generator.ts
export const UuidIdGeneratorLive = Layer.succeed(IdGenerator, {
  generateProductId: () => Effect.succeed(MakeProductId(uuidv4())),
  generateCorrelationId: () => Effect.succeed(uuidv4()),
})
```

## Erreurs d'infrastructure

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
}> {}
```

## Structure de fichiers

```
ports/driven/
├── repositories/
│   └── {entity}.repository.ts     # Context.Tag (interface)
├── services/
│   ├── clock.ts
│   ├── id-generator.ts
│   └── event-publisher.ts
├── errors.ts
└── index.ts

infrastructure/
├── persistence/
│   ├── mongodb/
│   │   ├── mongo-database.ts       # MongoDatabase Context.Tag
│   │   ├── base-repository.ts      # Helpers génériques
│   │   ├── {entity}.repository.ts  # Layer.effect
│   │   └── mappers/
│   │       └── {entity}.mapper.ts
│   └── in-memory/
│       ├── generic.repository.ts
│       └── {entity}.repository.ts
├── messaging/
│   └── rabbitmq/
│       ├── connection.ts
│       ├── event-publisher.ts
│       └── consumer.ts
└── services/
    ├── system-clock.ts
    └── uuid-id-generator.ts
```

## Composition des Layers

```typescript
// composition/layers/development.layer.ts
export const DevelopmentLayer = Layer.mergeAll(
  // Repositories
  MongodbPilotProductRepositoryLive.pipe(Layer.provide(MongoDatabaseLive)),
  MongodbCatalogProductRepositoryLive.pipe(Layer.provide(MongoDatabaseLive)),

  // Services
  UuidIdGeneratorLive,
  SystemClockLive,

  // Messaging
  RabbitMQEventPublisherLive.pipe(Layer.provide(RabbitMQConnectionLive))
)
```

## Références détaillées

- [MongoDB Repository](references/mongodb/repository.md) - Pattern complet
- [MongoDB Mapper](references/mongodb/mapper.md) - domain ↔ document
- [RabbitMQ Publisher](references/rabbitmq/publisher.md) - Event publishing
- [In-Memory Repository](references/testing/in-memory.md) - Pour tests
