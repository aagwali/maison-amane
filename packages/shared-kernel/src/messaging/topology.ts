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
} as const

/**
 * Dérive automatiquement le nom du Dead Letter Exchange
 * Convention: {exchange}.dlx
 */
export const toDlxExchange = (exchange: string): string => `${exchange}.dlx`

// ============================================
// ROUTING KEYS
// ============================================

export const ROUTING_KEYS = {
  PRODUCT_PUBLISHED: 'product.published',
  PRODUCT_UPDATED: 'product.updated',
} as const

// ============================================
// DECLARE EXCHANGE (helper générique)
// ============================================

/**
 * Déclare un exchange et son DLX associé
 * Idempotent : peut être appelé plusieurs fois sans erreur
 */
export const declareExchange = (
  exchange: string
): Effect.Effect<void, RabbitMQError, RabbitMQConnection> =>
  Effect.gen(function* () {
    const { channel } = yield* RabbitMQConnection
    const dlx = toDlxExchange(exchange)

    yield* Effect.tryPromise({
      try: async () => {
        // Dead Letter Exchange
        await channel.assertExchange(dlx, 'topic', {
          durable: true,
        })

        // Main Exchange
        await channel.assertExchange(exchange, 'topic', {
          durable: true,
        })
      },
      catch: (error) =>
        new RabbitMQError({
          cause: error,
          operation: 'declareExchange',
        }),
    })

    yield* Effect.logInfo('RabbitMQ exchange declared').pipe(
      Effect.annotateLogs({
        exchange,
        dlx,
      })
    )
  })

// ============================================
// CONSUMER INFRASTRUCTURE FACTORY
// ============================================

/**
 * Configuration pour la déclaration de l'infrastructure d'un consumer
 */
export interface ConsumerInfraConfig {
  readonly queuePrefix: string
  readonly exchange: string // Main exchange (DLX sera automatiquement {exchange}.dlx)
  readonly routingKeys: readonly string[]
  readonly retryTtl?: number
}

/**
 * Factory pour déclarer l'infrastructure complète d'un consumer (DLQ, Retry, Main Queue)
 *
 * Best Practice:
 * - Ne spécifie pas x-dead-letter-routing-key pour préserver automatiquement
 *   la routing key originale lors du dead-lettering
 * - Le DLX est automatiquement dérivé selon la convention {exchange}.dlx
 */
export const declareConsumerInfrastructure = (
  config: ConsumerInfraConfig
): Effect.Effect<void, RabbitMQError, RabbitMQConnection> =>
  Effect.gen(function* () {
    const { channel } = yield* RabbitMQConnection
    const { queuePrefix, exchange, routingKeys, retryTtl = 5000 } = config

    const mainExchange = exchange
    const dlxExchange = toDlxExchange(exchange)

    // Déclare l'exchange et son DLX (idempotent)
    yield* declareExchange(exchange)

    const dlqName = `${queuePrefix}.dlq`
    const retryName = `${queuePrefix}.retry`
    const mainName = `${queuePrefix}.queue`

    yield* Effect.tryPromise({
      try: async () => {
        // 1. DLQ (Dead Letter Queue)
        await channel.assertQueue(dlqName, {
          durable: true,
        })

        // Bind DLQ to DLX for all routing keys
        for (const routingKey of routingKeys) {
          await channel.bindQueue(dlqName, dlxExchange, routingKey)
        }

        // 2. Retry Queue
        // Note: Pas de x-dead-letter-routing-key → RabbitMQ préserve l'originale
        await channel.assertQueue(retryName, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': mainExchange,
            'x-message-ttl': retryTtl,
          },
        })

        // 3. Main Queue
        // Note: Pas de x-dead-letter-routing-key → RabbitMQ préserve l'originale
        await channel.assertQueue(mainName, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': dlxExchange,
          },
        })

        // Bind main queue to main exchange for all routing keys
        for (const routingKey of routingKeys) {
          await channel.bindQueue(mainName, mainExchange, routingKey)
        }
      },
      catch: (error) =>
        new RabbitMQError({
          cause: error,
          operation: `declareConsumerInfra:${queuePrefix}`,
        }),
    })

    yield* Effect.logInfo(`${queuePrefix} infrastructure declared`).pipe(
      Effect.annotateLogs({
        queues: [mainName, retryName, dlqName].join(', '),
        exchange: mainExchange,
        dlx: dlxExchange,
      })
    )
  })
