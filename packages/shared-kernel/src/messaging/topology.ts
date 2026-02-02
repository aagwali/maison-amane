// packages/shared-kernel/src/messaging/topology.ts

import type * as amqp from 'amqplib'
import { Context, Data, Effect } from 'effect'

// ============================================
// RABBITMQ CONNECTION SERVICE (Interface)
// ============================================

export interface RabbitMQConnectionValue {
  readonly connection: amqp.ChannelModel
  readonly channel: amqp.Channel
}

export class RabbitMQConnection extends Context.Tag('RabbitMQConnection')<
  RabbitMQConnection,
  RabbitMQConnectionValue
>() {}

// ============================================
// ERRORS
// ============================================

export class RabbitMQError extends Data.TaggedError('RabbitMQError')<{
  readonly cause: unknown
  readonly operation?: string
}> {}

// ============================================
// EXCHANGES
// ============================================

export const EXCHANGES = {
  PILOT_EVENTS: 'pilot.events',
  PILOT_EVENTS_DLX: 'pilot.events.dlx',
} as const

// ============================================
// ROUTING KEYS
// ============================================

export const ROUTING_KEYS = {
  PRODUCT_PUBLISHED: 'product.published',
  PRODUCT_UPDATED: 'product.updated',
} as const

// ============================================
// QUEUES
// ============================================

export const QUEUES = {
  CATALOG_PROJECTION: 'catalog-projection.queue',
  CATALOG_PROJECTION_DLQ: 'catalog-projection.dlq',
  CATALOG_PROJECTION_RETRY: 'catalog-projection.retry',
  SHOPIFY_SYNC: 'shopify-sync.queue',
  SHOPIFY_SYNC_DLQ: 'shopify-sync.dlq',
  SHOPIFY_SYNC_RETRY: 'shopify-sync.retry',
} as const

// ============================================
// DECLARE EXCHANGES (shared topology)
// Déclare uniquement les exchanges (appelé une fois au démarrage)
// ============================================

export const declareExchanges: Effect.Effect<void, RabbitMQError, RabbitMQConnection> = Effect.gen(
  function* () {
    const { channel } = yield* RabbitMQConnection

    yield* Effect.tryPromise({
      try: async () => {
        // Dead Letter Exchange
        await channel.assertExchange(EXCHANGES.PILOT_EVENTS_DLX, 'topic', {
          durable: true,
        })

        // Main Exchange
        await channel.assertExchange(EXCHANGES.PILOT_EVENTS, 'topic', {
          durable: true,
        })
      },
      catch: (error) =>
        new RabbitMQError({
          cause: error,
          operation: 'declareExchanges',
        }),
    })

    yield* Effect.logInfo('RabbitMQ exchanges declared').pipe(
      Effect.annotateLogs({
        exchanges: Object.values(EXCHANGES).join(', '),
      })
    )
  }
)

// ============================================
// DECLARE CATALOG PROJECTION INFRASTRUCTURE
// ============================================

export const declareCatalogProjectionInfra: Effect.Effect<void, RabbitMQError, RabbitMQConnection> =
  Effect.gen(function* () {
    const { channel } = yield* RabbitMQConnection

    yield* Effect.tryPromise({
      try: async () => {
        // 1. DLQ (Dead Letter Queue)
        await channel.assertQueue(QUEUES.CATALOG_PROJECTION_DLQ, {
          durable: true,
        })

        // Bind DLQ to DLX for both published and updated events
        await channel.bindQueue(
          QUEUES.CATALOG_PROJECTION_DLQ,
          EXCHANGES.PILOT_EVENTS_DLX,
          ROUTING_KEYS.PRODUCT_PUBLISHED
        )
        await channel.bindQueue(
          QUEUES.CATALOG_PROJECTION_DLQ,
          EXCHANGES.PILOT_EVENTS_DLX,
          ROUTING_KEYS.PRODUCT_UPDATED
        )

        // 2. Retry Queue
        await channel.assertQueue(QUEUES.CATALOG_PROJECTION_RETRY, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': EXCHANGES.PILOT_EVENTS,
            'x-dead-letter-routing-key': ROUTING_KEYS.PRODUCT_PUBLISHED,
            'x-message-ttl': 5000, // 5 seconds default
          },
        })

        // 3. Main Queue
        await channel.assertQueue(QUEUES.CATALOG_PROJECTION, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': EXCHANGES.PILOT_EVENTS_DLX,
            'x-dead-letter-routing-key': ROUTING_KEYS.PRODUCT_PUBLISHED,
          },
        })

        // Bind main queue to main exchange for both published and updated events
        await channel.bindQueue(
          QUEUES.CATALOG_PROJECTION,
          EXCHANGES.PILOT_EVENTS,
          ROUTING_KEYS.PRODUCT_PUBLISHED
        )
        await channel.bindQueue(
          QUEUES.CATALOG_PROJECTION,
          EXCHANGES.PILOT_EVENTS,
          ROUTING_KEYS.PRODUCT_UPDATED
        )
      },
      catch: (error) =>
        new RabbitMQError({
          cause: error,
          operation: 'declareCatalogProjectionInfra',
        }),
    })

    yield* Effect.logInfo('Catalog projection infrastructure declared').pipe(
      Effect.annotateLogs({
        queues: [
          QUEUES.CATALOG_PROJECTION,
          QUEUES.CATALOG_PROJECTION_RETRY,
          QUEUES.CATALOG_PROJECTION_DLQ,
        ].join(', '),
      })
    )
  })

// ============================================
// DECLARE SHOPIFY SYNC INFRASTRUCTURE
// ============================================

export const declareShopifySyncInfra: Effect.Effect<void, RabbitMQError, RabbitMQConnection> =
  Effect.gen(function* () {
    const { channel } = yield* RabbitMQConnection

    yield* Effect.tryPromise({
      try: async () => {
        // 1. DLQ (Dead Letter Queue)
        await channel.assertQueue(QUEUES.SHOPIFY_SYNC_DLQ, {
          durable: true,
        })

        // Bind DLQ to DLX for both published and updated events
        await channel.bindQueue(
          QUEUES.SHOPIFY_SYNC_DLQ,
          EXCHANGES.PILOT_EVENTS_DLX,
          ROUTING_KEYS.PRODUCT_PUBLISHED
        )
        await channel.bindQueue(
          QUEUES.SHOPIFY_SYNC_DLQ,
          EXCHANGES.PILOT_EVENTS_DLX,
          ROUTING_KEYS.PRODUCT_UPDATED
        )

        // 2. Retry Queue
        await channel.assertQueue(QUEUES.SHOPIFY_SYNC_RETRY, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': EXCHANGES.PILOT_EVENTS,
            'x-dead-letter-routing-key': ROUTING_KEYS.PRODUCT_PUBLISHED,
            'x-message-ttl': 5000, // 5 seconds default
          },
        })

        // 3. Main Queue
        await channel.assertQueue(QUEUES.SHOPIFY_SYNC, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': EXCHANGES.PILOT_EVENTS_DLX,
            'x-dead-letter-routing-key': ROUTING_KEYS.PRODUCT_PUBLISHED,
          },
        })

        // Bind main queue to main exchange for both published and updated events
        await channel.bindQueue(
          QUEUES.SHOPIFY_SYNC,
          EXCHANGES.PILOT_EVENTS,
          ROUTING_KEYS.PRODUCT_PUBLISHED
        )
        await channel.bindQueue(
          QUEUES.SHOPIFY_SYNC,
          EXCHANGES.PILOT_EVENTS,
          ROUTING_KEYS.PRODUCT_UPDATED
        )
      },
      catch: (error) =>
        new RabbitMQError({
          cause: error,
          operation: 'declareShopifySyncInfra',
        }),
    })

    yield* Effect.logInfo('Shopify sync infrastructure declared').pipe(
      Effect.annotateLogs({
        queues: [QUEUES.SHOPIFY_SYNC, QUEUES.SHOPIFY_SYNC_RETRY, QUEUES.SHOPIFY_SYNC_DLQ].join(
          ', '
        ),
      })
    )
  })

// ============================================
// DECLARE ALL TOPOLOGY
// Déclare les exchanges + toutes les queues
// Utile pour init complète ou tests
// ============================================

export const declareAllTopology: Effect.Effect<void, RabbitMQError, RabbitMQConnection> =
  Effect.gen(function* () {
    // 1. Déclarer les exchanges
    yield* declareExchanges

    // 2. Déclarer toutes les infras consumers
    yield* declareCatalogProjectionInfra
    yield* declareShopifySyncInfra

    yield* Effect.logInfo('All RabbitMQ topology declared')
  })
