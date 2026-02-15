---
name: infra-adapter
description: "Implémente et modifie les adapters d'infrastructure avec Effect-TS : repositories MongoDB/in-memory, services, messaging RabbitMQ, layers. Utiliser quand: (1) Implémenter/modifier un repository, (2) Créer un adapter, (3) Ajouter un service infrastructure, (4) Ajouter un publisher d'events, (5) Modifier un mapper MongoDB, (6) Ajouter une méthode au repository, (7) Implémenter un port (Context.Tag), (8) Ajouter un layer de composition, (9) Créer un service infrastructure, (10) Implement the repository, (11) Modify an adapter, (12) Add a service, (13) Add a publisher, (14) Modify the MongoDB mapper, (15) Add a method to the repo, (16) Create an adapter, (17) Implement a port, (18) Add a layer."
---

# Infrastructure Adapter Skill

## Workflow — Repository

1. Define the port (`Context.Tag`) in `ports/driven/repositories/`
2. Create the MongoDB mapper in `infrastructure/persistence/mongodb/mappers/`
3. Implement the MongoDB repository in `infrastructure/persistence/mongodb/`
4. Implement the in-memory repository in `infrastructure/persistence/in-memory/`
5. Create the Live Layer (MongoDB)
6. Create the Test Layer (in-memory)

## Workflow — Service

1. Define the port (`Context.Tag`) in `ports/driven/services/`
2. Implement the service in `infrastructure/services/`
3. Create the Live Layer

## Workflow — Event Publisher

1. Define the port in `ports/driven/services/event-publisher.ts`
2. Implement the RabbitMQ publisher in `infrastructure/messaging/rabbitmq/`
3. Create the Live Layer

## Rules & Conventions

### Port Pattern (Context.Tag)

```typescript
export interface PilotProductRepositoryService {
  readonly save: (product: PilotProduct) => Effect<PilotProduct, PersistenceError>
  readonly update: (product: PilotProduct) => Effect<PilotProduct, PersistenceError>
  readonly findById: (id: ProductId) => Effect<Option<PilotProduct>, PersistenceError>
  readonly getById: (id: ProductId) => Effect<PilotProduct, PersistenceError | ProductNotFoundError>
}

export class PilotProductRepository extends Context.Tag('PilotProductRepository')<
  PilotProductRepository,
  PilotProductRepositoryService
>() {}
```

Tag string MUST match class name.

### Service Ports

```typescript
export interface ClockService {
  readonly now: () => Effect<Date>
}
export class Clock extends Context.Tag('Clock')<Clock, ClockService>() {}

export interface IdGeneratorService {
  readonly generateProductId: () => Effect<ProductId>
  readonly generateCorrelationId: () => Effect<string>
}
export class IdGenerator extends Context.Tag('IdGenerator')<IdGenerator, IdGeneratorService>() {}
```

### Event Publisher Port

```typescript
export class EventPublishError extends Data.TaggedError('EventPublishError')<{
  readonly event: DomainEvent
  readonly cause: unknown
}> {}

export interface EventPublisherService {
  readonly publish: (event: DomainEvent) => Effect<void, EventPublishError>
}

export class EventPublisher extends Context.Tag('EventPublisher')<
  EventPublisher,
  EventPublisherService
>() {}
```

### PersistenceError (simplified)

```typescript
export class PersistenceError extends Data.TaggedError('PersistenceError')<{
  readonly cause: unknown
}> {}
```

### MongoDB Repository Implementation

Use generic helpers from `base-repository.ts`:

```typescript
const COLLECTION_NAME = 'pilot_products'

export const createMongodbPilotProductRepository = (db: Db): PilotProductRepositoryService => {
  const collection: Collection<PilotProductDocument> = db.collection(COLLECTION_NAME)

  return {
    save: (product) => insertDocument(collection, toDocument(product), product),
    findById: (id) => findDocumentById(collection, id, fromDocument),
    getById: (id) =>
      getDocumentById(
        collection,
        id,
        fromDocument,
        (productId) => new ProductNotFoundError({ productId })
      ),
    update: (product) => replaceDocument(collection, product.id, toDocument(product), product),
  }
}
```

### Base Repository Helpers

```typescript
// Wrap MongoDB operations with PersistenceError
export const tryMongoOperation = <A>(operation: () => Promise<A>): Effect<A, PersistenceError> =>
  tryPromise({ try: operation, catch: (error) => new PersistenceError({ cause: error }) })

// Generic CRUD helpers
export const insertDocument = <TDoc, TEntity>(collection, doc, entity): Effect<TEntity, PersistenceError>
export const replaceDocument = <TDoc, TEntity>(collection, id, doc, entity): Effect<TEntity, PersistenceError>
export const findDocumentById = <TDoc, TEntity>(collection, id, fromDocument): Effect<Option<TEntity>, PersistenceError>
export const getDocumentById = <TDoc, TEntity, TError>(collection, id, fromDocument, notFoundError): Effect<TEntity, PersistenceError | TError>
```

### MongoDB Mapper Pattern

Two functions: `toDocument` (domain → MongoDB doc) and `fromDocument` (doc → domain):

```typescript
export const pilotToDocument = (product: PilotProduct): PilotProductDocument => ({
  _id: product.id,
  label: product.label,
  // ... unwrap branded types to primitives
})

export const pilotFromDocument = (doc: PilotProductDocument): PilotProduct => ({
  _tag: 'PilotProduct',
  id: makeProductId(doc._id),
  label: makeProductLabel(doc.label),
  // ... reconstruct branded types from primitives
})
```

### In-Memory Repository (generic)

```typescript
export const createInMemoryRepository = <T, Id extends string>(
  getId: (entity: T) => Id
): InMemoryRepository<T, Id> => {
  const store = new Map<Id, T>()
  return {
    save: (entity) => trySync({ try: () => { store.set(getId(entity), entity); return entity }, ... }),
    findById: (id) => trySync({ try: () => store.get(id) ? Option.some(...) : Option.none(), ... }),
    getById: (id, notFoundError) => trySync({ try: () => {
      const entity = store.get(id)
      if (!entity) throw notFoundError(id)
      return entity
    }, catch: (error) => '_tag' in error ? error : new PersistenceError({ cause: error }) }),
    update: (entity) => trySync({ ... }),
  }
}
```

Concrete in-memory repo delegates to generic and provides `notFoundError` factory:

```typescript
export const createInMemoryPilotProductRepository = (): PilotProductRepositoryService => {
  const baseRepo = createInMemoryRepository<PilotProduct, string>((product) => product.id)
  return {
    save: baseRepo.save,
    findById: baseRepo.findById,
    getById: (id) => baseRepo.getById(id, (productId) => new ProductNotFoundError({ productId })),
    update: baseRepo.update,
  }
}

export const InMemoryPilotProductRepositoryLive = Layer.succeed(
  PilotProductRepository,
  createInMemoryPilotProductRepository()
)
```

### Layer Pattern

```typescript
// MongoDB: uses factory function
export const MongodbPilotProductRepositoryLive = createRepositoryLayer(
  PilotProductRepositoryTag,
  createMongodbPilotProductRepository
)

// In-memory: Layer.succeed (no deps)
export const InMemoryPilotProductRepositoryLive = Layer.succeed(
  PilotProductRepository,
  createInMemoryPilotProductRepository()
)

// Services: Layer.succeed
export const StubClockLive = (fixedDate = TEST_DATE) => Layer.succeed(Clock, stubClock(fixedDate))
```

## Reference Files

| Pattern             | File                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------ |
| Repository port     | `apps/server/src/ports/driven/repositories/pilot-product.repository.ts`              |
| PersistenceError    | `apps/server/src/ports/driven/repositories/errors.ts`                                |
| Clock port          | `apps/server/src/ports/driven/services/clock.ts`                                     |
| IdGenerator port    | `apps/server/src/ports/driven/services/id-generator.ts`                              |
| EventPublisher port | `apps/server/src/ports/driven/services/event-publisher.ts`                           |
| Base helpers        | `apps/server/src/infrastructure/persistence/mongodb/base-repository.ts`              |
| MongoDB repo        | `apps/server/src/infrastructure/persistence/mongodb/pilot-product.repository.ts`     |
| MongoDB mapper      | `apps/server/src/infrastructure/persistence/mongodb/mappers/pilot-product.mapper.ts` |
| Generic in-memory   | `apps/server/src/infrastructure/persistence/in-memory/generic.repository.ts`         |
| In-memory repo      | `apps/server/src/infrastructure/persistence/in-memory/pilot-product.repository.ts`   |
| Composition layers  | `apps/server/src/composition/layers/`                                                |

## Quality Checklist

- [ ] Port defined with `Context.Tag` (tag string = class name)
- [ ] Repository with `getById` and `findById`
- [ ] `PersistenceError({ cause })` simplified
- [ ] MongoDB mapper with `toDocument` and `fromDocument`
- [ ] In-memory repo via `createInMemoryRepository`
- [ ] Layer defined with `Layer.effect`, `Layer.succeed`, or factory
- [ ] Typed errors throughout
