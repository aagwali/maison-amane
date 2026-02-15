---
name: consumer
description: "Crée et modifie les consumers RabbitMQ avec Effect-TS : apps/consumers, message handling, layer composition, projection read model. Utiliser quand: (1) Créer un consumer RabbitMQ, (2) Écouter les domain events, (3) Modifier un consumer existant, (4) Ajouter un routing key, (5) Créer un nouveau consumer RabbitMQ, (6) Créer un consumer d'events, (7) Créer une projection read model, (8) Créer un consumer pour [événement spécifique], (9) Create a consumer, (10) Listen to events, (11) Modify a consumer, (12) Add a routing key, (13) New RabbitMQ consumer, (14) Event consumer, (15) Read model projection, (16) Create a consumer for [event]."
---

# Consumer Skill

## Workflow

1. Create app structure in `apps/consumers/{consumer-name}/`
2. Create `package.json` with Effect + RabbitMQ deps
3. Add routing keys in `@maison-amane/shared-kernel` if new events
4. Create the message handler (domain event → side effect)
5. Compose layers specific to this consumer
6. Create `main.ts` with `bootstrapConsumer` + `startConsumer`
7. Add script in `turbo.json` if needed

## Rules & Conventions

### Consumer App Structure

```
apps/consumers/{consumer-name}/
├── src/
│   └── main.ts
├── package.json
└── tsconfig.json
```

### EXCHANGES and ROUTING_KEYS (centralized)

From `@maison-amane/shared-kernel`:

```typescript
export const EXCHANGES = {
  PILOT_EVENTS: 'pilot.events',
} as const

export const ROUTING_KEYS = {
  PILOT: {
    PRODUCT_PUBLISHED: 'pilot.product.published',
    PRODUCT_UPDATED: 'pilot.product.updated',
  },
} as const
```

### Consumer Identity

Each consumer declares its name and queue prefix:

```typescript
const CONSUMER_NAME = 'catalog-projection'
```

### bootstrapConsumer Pattern

From `@maison-amane/shared-kernel`:

```typescript
const program = bootstrapConsumer({
  consumerName: CONSUMER_NAME,
  queuePrefix: 'catalog-projection',
  exchange: EXCHANGES.PILOT_EVENTS,
  routingKeys: [ROUTING_KEYS.PILOT.PRODUCT_PUBLISHED, ROUTING_KEYS.PILOT.PRODUCT_UPDATED],
  startConsumer: startConsumer(CONSUMER_NAME, catalogProjectionHandler),
}).pipe(provide(layers))
```

### Layer Composition

Each consumer has its own layers — only what it needs:

```typescript
const LoggerLayer = createLoggerLive(PrettyLogger, JsonLogger)
const RabbitMQLayer = Layer.provideMerge(RabbitMQConnectionLive, RabbitMQConfigLive)
const CatalogProductRepositoryLayer = MongodbCatalogProductRepositoryLive.pipe(
  Layer.provide(MongoDatabaseLive)
)

const layers = Layer.mergeAll(RabbitMQLayer, LoggerLayer, CatalogProductRepositoryLayer)
```

### startConsumer

From `@maison-amane/server`, wraps the handler with channel setup:

```typescript
startConsumer(CONSUMER_NAME, catalogProjectionHandler)
```

The handler is imported from the server package where it's defined alongside the domain logic.

### Running the Consumer

```typescript
NodeRuntime.runMain(program)
```

### MessageHandler Type

From `ports/driven/services/message-handler.ts`:

```typescript
export interface MessageHandlerService {
  readonly handle: (message: unknown) => Effect<void, MessageHandlingError>
}
```

### Error Handling

- `MessageHandlingError` for handler failures
- `EventPublishError` for publisher failures
- Consumer logs errors but keeps running (resilient)

## Reference Files

| Pattern               | File                                                       |
| --------------------- | ---------------------------------------------------------- |
| Consumer (projection) | `apps/consumers/catalog-projection/src/main.ts`            |
| Consumer (sync)       | `apps/consumers/shopify-sync/src/main.ts`                  |
| Consumer package.json | `apps/consumers/catalog-projection/package.json`           |
| Shared-kernel exports | `packages/shared-kernel/src/`                              |
| MessageHandler type   | `apps/server/src/ports/driven/services/message-handler.ts` |

## Complete main.ts Template

```typescript
import { Layer } from 'effect'
import { NodeRuntime } from '@effect/platform-node'
import {
  myHandler,
  JsonLogger,
  PrettyLogger,
  MongoDatabaseLive,
  MongodbMyRepositoryLive,
  RabbitMQConfigLive,
  RabbitMQConnectionLive,
  startConsumer,
} from '@maison-amane/server'
import {
  bootstrapConsumer,
  createLoggerLive,
  EXCHANGES,
  ROUTING_KEYS,
} from '@maison-amane/shared-kernel'
import { provide } from 'effect/Effect'

const CONSUMER_NAME = 'my-consumer'

const LoggerLayer = createLoggerLive(PrettyLogger, JsonLogger)
const RabbitMQLayer = Layer.provideMerge(RabbitMQConnectionLive, RabbitMQConfigLive)
const RepositoryLayer = MongodbMyRepositoryLive.pipe(Layer.provide(MongoDatabaseLive))
const layers = Layer.mergeAll(RabbitMQLayer, LoggerLayer, RepositoryLayer)

const program = bootstrapConsumer({
  consumerName: CONSUMER_NAME,
  queuePrefix: CONSUMER_NAME,
  exchange: EXCHANGES.PILOT_EVENTS,
  routingKeys: [ROUTING_KEYS.PILOT.PRODUCT_PUBLISHED],
  startConsumer: startConsumer(CONSUMER_NAME, myHandler),
}).pipe(provide(layers))

NodeRuntime.runMain(program)
```

## Quality Checklist

- [ ] App structure in `apps/consumers/`
- [ ] `package.json` with Effect + RabbitMQ deps
- [ ] Routing keys in shared-kernel if new events
- [ ] Handler implements message parsing with Schema
- [ ] Layer composition specific to this consumer
- [ ] `bootstrapConsumer()` used in `main.ts`
- [ ] Typed error handling (`MessageHandlingError`)
- [ ] Consumer name declared as constant
- [ ] `NodeRuntime.runMain(program)` to run
