// src/infrastructure/messaging/rabbitmq/event-publisher.ts

import { Layer } from 'effect'
import { gen, tryPromise, logInfo, annotateLogs, withLogSpan } from 'effect/Effect'
import { EXCHANGES, ROUTING_KEYS, RabbitMQConnection } from '@maison-amane/shared-kernel'

import { EventPublisher, EventPublishError } from '../../../ports/driven'
import type { DomainEvent } from '../../../domain'

// ============================================
// EVENT TO ROUTING KEY MAPPER
// ============================================

const getRoutingKey = (event: DomainEvent): string => {
  switch (event._tag) {
    case 'PilotProductPublished':
      return ROUTING_KEYS.PRODUCT_PUBLISHED
    case 'PilotProductUpdated':
      return ROUTING_KEYS.PRODUCT_UPDATED
  }
}

// ============================================
// SERIALIZE EVENT FOR RABBITMQ
// ============================================

const serializeEvent = (event: DomainEvent): Buffer => {
  return Buffer.from(
    JSON.stringify({
      ...event,
      timestamp: event.timestamp.toISOString(),
    })
  )
}

// ============================================
// RABBITMQ EVENT PUBLISHER IMPLEMENTATION
// ============================================

const createRabbitMQEventPublisher = gen(function* () {
  const { channel } = yield* RabbitMQConnection

  return {
    publish: (event: DomainEvent) =>
      gen(function* () {
        const routingKey = getRoutingKey(event)
        const message = serializeEvent(event)

        yield* tryPromise({
          try: async () => {
            const published = channel.publish(EXCHANGES.PILOT_EVENTS, routingKey, message, {
              persistent: true, // Durable messages
              contentType: 'application/json',
              headers: {
                eventType: event._tag,
                eventVersion: event._version,
                correlationId: event.correlationId,
                userId: event.userId,
                publishedAt: new Date().toISOString(),
              },
            })

            if (!published) {
              throw new Error('Channel buffer full, message not published')
            }
          },
          catch: (error) => new EventPublishError({ event, cause: error }),
        })

        yield* logInfo('Domain event published to RabbitMQ')
          .pipe(annotateLogs({
            eventType: event._tag,
            productId: event.productId,
            correlationId: event.correlationId,
            userId: event.userId,
            exchange: EXCHANGES.PILOT_EVENTS,
            routingKey,
          }),
          withLogSpan('rabbitmq.publish'))
      }),
  }
})

// ============================================
// RABBITMQ EVENT PUBLISHER LAYER
// Requires RabbitMQConnection
// ============================================

export const RabbitMQEventPublisherLayer = Layer.effect(
  EventPublisher,
  createRabbitMQEventPublisher
)
