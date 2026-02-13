// src/infrastructure/messaging/rabbitmq/topology.ts

import { Data } from 'effect'
import { gen, tryPromise, logInfo, annotateLogs } from 'effect/Effect'
import { RabbitMQConnection } from '@maison-amane/shared-kernel'
import type * as amqp from 'amqplib'

import { RabbitMQConfig } from '../../../composition/config'

// ============================================
// EXCHANGE & QUEUE NAMES
// ============================================

export const Exchanges = {
  PILOT_EVENTS: 'pilot.events',
  PILOT_EVENTS_DLX: 'pilot.events.dlx',
} as const

// Queue names are dynamic per consumer
export const buildQueueNames = (consumerName: string) => ({
  main: `${consumerName}.queue`,
  dlq: `${consumerName}.dlq`,
  retry: `${consumerName}.retry`,
})

export const RoutingKeys = {
  PILOT_PRODUCT_PUBLISHED: 'product.published',
  PILOT_PRODUCT_SYNCED: 'product.synced',
  ALL_PILOT_EVENTS: 'product.*',
  ALL_CATALOG_EVENTS: 'catalog.*',
  ALL_EVENTS: '#',
} as const

// ============================================
// TOPOLOGY SETUP ERROR
// ============================================

export class TopologySetupError extends Data.TaggedError('TopologySetupError')<{
  readonly cause: unknown
}> {}

// ============================================
// SETUP EXCHANGES (shared topology)
// Called once - creates exchanges only
// ============================================

export const setupTopology = gen(function* () {
  const { channel } = yield* RabbitMQConnection

  yield* tryPromise({
    try: async () => {
      // Dead Letter Exchange (for failed messages)
      await channel.assertExchange(Exchanges.PILOT_EVENTS_DLX, 'topic', {
        durable: true,
      })

      // Main Exchange (for domain events)
      await channel.assertExchange(Exchanges.PILOT_EVENTS, 'topic', {
        durable: true,
      })
    },
    catch: (error) => new TopologySetupError({ cause: error }),
  })

  yield* logInfo('RabbitMQ exchanges configured')
    .pipe(annotateLogs({
      exchanges: Object.values(Exchanges).join(', '),
    }))
})

// ============================================
// SETUP CONSUMER QUEUE
// Creates queue + retry + dlq for a specific consumer
// Each consumer calls this with its own name
// ============================================

export const setupConsumerQueue = (consumerName: string) =>
  gen(function* () {
    const { channel } = yield* RabbitMQConnection
    const config = yield* RabbitMQConfig
    const queues = buildQueueNames(consumerName)

    yield* tryPromise({
      try: async () => {
        // 1. Dead Letter Queue (final destination for failed messages)
        await channel.assertQueue(queues.dlq, {
          durable: true,
        })

        // Bind DLQ to DLX (only for product.published events)
        await channel.bindQueue(
          queues.dlq,
          Exchanges.PILOT_EVENTS_DLX,
          RoutingKeys.PILOT_PRODUCT_PUBLISHED
        )

        // 2. Retry Queue (holds messages before retry)
        await channel.assertQueue(queues.retry, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': Exchanges.PILOT_EVENTS,
            'x-dead-letter-routing-key': RoutingKeys.PILOT_PRODUCT_PUBLISHED,
            'x-message-ttl': config.retry.initialDelayMs,
          },
        })

        // 3. Main Queue (consumer processes from here)
        await channel.assertQueue(queues.main, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': Exchanges.PILOT_EVENTS_DLX,
            'x-dead-letter-routing-key': RoutingKeys.PILOT_PRODUCT_PUBLISHED,
          },
        })

        // Bind main queue to main exchange (explicit routing key, not wildcard)
        // Each consumer only receives PilotProductPublished events
        await channel.bindQueue(
          queues.main,
          Exchanges.PILOT_EVENTS,
          RoutingKeys.PILOT_PRODUCT_PUBLISHED
        )
      },
      catch: (error) => new TopologySetupError({ cause: error }),
    })

    yield* logInfo('Consumer queue configured')
      .pipe(annotateLogs({
        consumer: consumerName,
        queues: Object.values(queues).join(', '),
      }))

    return queues
  })

// ============================================
// HELPER: Get retry count from message headers
// ============================================

export const getRetryCount = (msg: amqp.ConsumeMessage, retryQueueName: string): number => {
  const xDeath = msg.properties.headers?.['x-death'] as
    | Array<{
        count: number
        queue: string
      }>
    | undefined

  if (!xDeath || xDeath.length === 0) return 0

  return xDeath
    .filter((d) => d.queue === retryQueueName)
    .reduce((sum, d) => sum + (d.count || 0), 0)
}

// ============================================
// HELPER: Calculate next delay (exponential backoff)
// ============================================

export const calculateDelay = (
  retryCount: number,
  initialDelayMs: number,
  multiplier: number
): number => {
  return initialDelayMs * Math.pow(multiplier, retryCount)
}
