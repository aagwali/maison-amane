// packages/shared-kernel/src/messaging/topology.ts

import type * as amqp from 'amqplib'
import { Context, Data } from 'effect'
import { annotateLogs, gen, logInfo, never, tryPromise, type Effect } from 'effect/Effect'

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
  PILOT: {
    PRODUCT_PUBLISHED: 'product.published',
    PRODUCT_UPDATED: 'product.updated',
    PRODUCT_CREATED: 'product.created',
  },
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
): Effect<void, RabbitMQError, RabbitMQConnection> =>
  gen(function* () {
    const { channel } = yield* RabbitMQConnection
    const dlx = toDlxExchange(exchange)

    yield* tryPromise({
      try: async () => {
        await channel.assertExchange(dlx, 'topic', { durable: true })

        await channel.assertExchange(exchange, 'topic', { durable: true })
      },
      catch: (error) => new RabbitMQError({ cause: error, operation: 'declareExchange' }),
    })

    yield* logInfo('RabbitMQ exchange declared')
      .pipe(annotateLogs({ exchange, dlx }))
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
): Effect<void, RabbitMQError, RabbitMQConnection> =>
  gen(function* () {
    const { channel } = yield* RabbitMQConnection
    const { queuePrefix, exchange, routingKeys } = config

    const mainExchange = exchange
    const dlxExchange = toDlxExchange(exchange)

    // Déclare l'exchange et son DLX (idempotent)
    yield* declareExchange(exchange)

    const dlqName = `${queuePrefix}.dlq`
    const retryName = `${queuePrefix}.retry`
    const mainName = `${queuePrefix}.queue`

    yield* tryPromise({
      try: async () => {
        await channel.assertQueue(dlqName, { durable: true })

        for (const routingKey of routingKeys) {
          await channel.bindQueue(dlqName, dlxExchange, routingKey)
        }
        // Bind DLQ for messages that went through retry cycle
        // (their routing key becomes mainName due to retry queue's x-dead-letter-routing-key)
        await channel.bindQueue(dlqName, dlxExchange, mainName)

        await channel.assertQueue(retryName, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': '', // Default exchange → routes directly by queue name
            'x-dead-letter-routing-key': mainName, // Route expired messages back to main queue
            // No x-message-ttl here - TTL comes from message expiration field
            // This allows per-message TTL for exponential backoff
          },
        })

        await channel.assertQueue(mainName, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': dlxExchange,
          },
        })

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

    yield* logInfo(`${queuePrefix} infrastructure declared`)
      .pipe(annotateLogs({
        queues: [mainName, retryName, dlqName].join(', '),
        exchange: mainExchange,
        dlx: dlxExchange,
      }))
  })

// ============================================
// CONSUMER BOOTSTRAP
// ============================================

/**
 * Configuration for bootstrapping a consumer
 */
export interface ConsumerBootstrapConfig<R = never> {
  consumerName: string
  queuePrefix: string
  exchange: string
  routingKeys: readonly string[]
  startConsumer: Effect<void, never, R>
}

/**
 * Bootstraps a RabbitMQ consumer with standard lifecycle:
 * - Logs startup
 * - Declares infrastructure (queue, exchange, bindings)
 * - Starts the consumer
 * - Logs ready state
 * - Runs forever (never completes)
 *
 * This function encapsulates the common pattern shared by all consumers.
 *
 * @param config - Consumer bootstrap configuration
 * @returns Effect that runs the consumer forever
 *
 * @example
 * ```typescript
 * import { bootstrapConsumer, EXCHANGES, ROUTING_KEYS } from '@maison-amane/shared-kernel'
 * import { startConsumer, catalogProjectionHandler } from '@maison-amane/server'
 *
 * const consumerLogic = bootstrapConsumer({
 *   consumerName: 'catalog-projection',
 *   queuePrefix: 'catalog-projection',
 *   exchange: EXCHANGES.PILOT_EVENTS,
 *   routingKeys: [ROUTING_KEYS.PRODUCT_PUBLISHED, ROUTING_KEYS.PRODUCT_UPDATED],
 *   startConsumer: startConsumer('catalog-projection', catalogProjectionHandler),
 * })
 * ```
 */
export const bootstrapConsumer = <R>(
  config: ConsumerBootstrapConfig<R>
): Effect<void, RabbitMQError, R | RabbitMQConnection> =>
  gen(function* () {
    yield* logInfo(`Starting ${config.consumerName} consumer...`)

    yield* declareConsumerInfrastructure({
      queuePrefix: config.queuePrefix,
      exchange: config.exchange,
      routingKeys: config.routingKeys,
    })

    yield* config.startConsumer

    yield* logInfo(`${config.consumerName} consumer ready - waiting for events...`)

    yield* never
  })
