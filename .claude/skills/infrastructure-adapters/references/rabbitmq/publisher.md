# RabbitMQ Event Publisher

## Pattern complet

```typescript
// infrastructure/messaging/rabbitmq/event-publisher.ts
import { Effect, Layer } from 'effect'

import { EventPublisher } from '../../../ports/driven'
import type { EventPublisherService } from '../../../ports/driven'
import { EventPublishError } from '../../../ports/driven/errors'
import { RabbitMQConnection } from './connection'
import type { PilotDomainEvent } from '../../../domain/pilot'

const EXCHANGE_NAME = 'pilot.events'

// =============================================================================
// ROUTING
// =============================================================================

const getRoutingKey = (event: PilotDomainEvent): string => {
  switch (event._tag) {
    case 'PilotProductPublished':
      return 'product.published'
    case 'PilotProductSynced':
      return 'product.synced'
    default:
      return 'unknown'
  }
}

// =============================================================================
// FACTORY
// =============================================================================

const createRabbitMQEventPublisher = (channel: Channel): EventPublisherService => ({
  publish: (event) =>
    Effect.gen(function* () {
      const routingKey = getRoutingKey(event)
      const message = Buffer.from(JSON.stringify(event))

      yield* Effect.tryPromise({
        try: () =>
          channel.publish(EXCHANGE_NAME, routingKey, message, {
            persistent: true,
            contentType: 'application/json',
            headers: {
              eventType: event._tag,
              correlationId: event.correlationId,
              userId: event.userId,
              publishedAt: new Date().toISOString(),
            },
          }),
        catch: (error) =>
          new EventPublishError({
            eventType: event._tag,
            cause: error,
          }),
      })

      yield* Effect.logInfo('Event published').pipe(
        Effect.annotateLogs({
          eventType: event._tag,
          routingKey,
          correlationId: event.correlationId,
        })
      )
    }),
})

// =============================================================================
// LAYER
// =============================================================================

export const RabbitMQEventPublisherLive = Layer.effect(
  EventPublisher,
  Effect.map(RabbitMQConnection, ({ channel }) => createRabbitMQEventPublisher(channel))
)
```

## Connection Layer

```typescript
// infrastructure/messaging/rabbitmq/connection.ts
import { Context, Effect, Layer } from 'effect'
import amqplib, { type Connection, type Channel } from 'amqplib'

export interface RabbitMQConnectionService {
  readonly connection: Connection
  readonly channel: Channel
}

export class RabbitMQConnection extends Context.Tag('RabbitMQConnection')<
  RabbitMQConnection,
  RabbitMQConnectionService
>() {}

export const RabbitMQConnectionLive = Layer.scoped(
  RabbitMQConnection,
  Effect.acquireRelease(
    Effect.gen(function* () {
      const config = yield* RabbitMQConfig
      const connection = yield* Effect.tryPromise(() => amqplib.connect(config.uri))
      const channel = yield* Effect.tryPromise(() => connection.createChannel())
      return { connection, channel }
    }),
    ({ connection, channel }) =>
      Effect.all([
        Effect.tryPromise(() => channel.close()),
        Effect.tryPromise(() => connection.close()),
      ]).pipe(Effect.catchAll(() => Effect.void))
  )
)
```

## Topology Setup

```typescript
// infrastructure/messaging/rabbitmq/topology.ts
import { Effect } from 'effect'
import type { Channel } from 'amqplib'

export const setupTopology = (channel: Channel) =>
  Effect.gen(function* () {
    // Main exchange
    yield* Effect.tryPromise(() =>
      channel.assertExchange('pilot.events', 'topic', { durable: true })
    )

    // Dead letter exchange
    yield* Effect.tryPromise(() =>
      channel.assertExchange('pilot.events.dlx', 'topic', { durable: true })
    )

    yield* Effect.logInfo('RabbitMQ topology initialized')
  })
```

## Consumer Setup (pour projections)

```typescript
// infrastructure/messaging/rabbitmq/consumer.ts
export const createConsumer = (
  channel: Channel,
  queueName: string,
  routingKeys: string[],
  handler: MessageHandler<PilotDomainEvent, any>
) =>
  Effect.gen(function* () {
    // Setup queue
    yield* Effect.tryPromise(() =>
      channel.assertQueue(queueName, {
        durable: true,
        deadLetterExchange: 'pilot.events.dlx',
      })
    )

    // Bind to routing keys
    for (const key of routingKeys) {
      yield* Effect.tryPromise(() => channel.bindQueue(queueName, 'pilot.events', key))
    }

    // Start consuming
    yield* Effect.tryPromise(() =>
      channel.consume(queueName, async (msg) => {
        if (!msg) return

        const event = JSON.parse(msg.content.toString())
        const result = await Effect.runPromise(handler(event).pipe(Effect.either))

        if (result._tag === 'Right') {
          channel.ack(msg)
        } else {
          channel.nack(msg, false, false) // To DLQ
        }
      })
    )
  })
```

## Port Interface

```typescript
// ports/driven/services/event-publisher.ts
import { Context, Effect } from 'effect'
import type { PilotDomainEvent } from '../../../domain/pilot'
import type { EventPublishError } from '../errors'

export interface EventPublisherService {
  readonly publish: (event: PilotDomainEvent) => Effect.Effect<void, EventPublishError>
}

export class EventPublisher extends Context.Tag('EventPublisher')<
  EventPublisher,
  EventPublisherService
>() {}
```

## Test Double (Console)

```typescript
// infrastructure/messaging/console-event-publisher.ts
export const ConsoleEventPublisherLive = Layer.succeed(EventPublisher, {
  publish: (event) =>
    Effect.logInfo('Event published (console)').pipe(
      Effect.annotateLogs({
        eventType: event._tag,
        productId: event.productId,
      })
    ),
})
```

## Checklist

- [ ] Routing key basé sur `event._tag`
- [ ] Message persistent avec headers
- [ ] `Layer.scoped` pour cleanup connection
- [ ] Topology setup (exchanges, DLX)
- [ ] Console publisher pour dev/tests
- [ ] Logging avec correlationId
