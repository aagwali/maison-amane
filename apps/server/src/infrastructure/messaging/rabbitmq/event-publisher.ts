// src/infrastructure/messaging/rabbitmq/event-publisher.ts

import { Effect, Layer } from 'effect'

import { EventPublisher, EventPublishError } from '../../../ports/driven'
import { RabbitMQConnection } from './connection'
import { Exchanges, RoutingKeys } from './topology'

import type { PilotDomainEvent } from "../../../domain/pilot"
// ============================================
// EVENT TO ROUTING KEY MAPPER
// ============================================

const getRoutingKey = (event: PilotDomainEvent): string => {
  // Currently only one event type, will expand as domain grows
  switch (event._tag) {
    case "PilotProductPublished":
      return RoutingKeys.PILOT_PRODUCT_PUBLISHED
  }
}

// ============================================
// SERIALIZE EVENT FOR RABBITMQ
// ============================================

const serializeEvent = (event: PilotDomainEvent): Buffer => {
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

const makeRabbitMQEventPublisher = Effect.gen(function* () {
  const { channel } = yield* RabbitMQConnection

  return {
    publish: (event: PilotDomainEvent) =>
      Effect.gen(function* () {
        const routingKey = getRoutingKey(event)
        const message = serializeEvent(event)

        yield* Effect.tryPromise({
          try: async () => {
            const published = channel.publish(
              Exchanges.PILOT_EVENTS,
              routingKey,
              message,
              {
                persistent: true, // Durable messages
                contentType: "application/json",
                headers: {
                  eventType: event._tag,
                  correlationId: event.correlationId,
                  userId: event.userId,
                  publishedAt: new Date().toISOString(),
                },
              }
            )

            if (!published) {
              throw new Error("Channel buffer full, message not published")
            }
          },
          catch: (error) => new EventPublishError({ event, cause: error }),
        })

        yield* Effect.logInfo("Domain event published to RabbitMQ").pipe(
          Effect.annotateLogs({
            eventType: event._tag,
            productId: event.productId,
            correlationId: event.correlationId,
            userId: event.userId,
            exchange: Exchanges.PILOT_EVENTS,
            routingKey,
          }),
          Effect.withLogSpan("rabbitmq.publish")
        )
      })
  }
})

// ============================================
// RABBITMQ EVENT PUBLISHER LAYER
// Requires RabbitMQConnection
// ============================================

export const RabbitMQEventPublisherLayer = Layer.effect(
  EventPublisher,
  makeRabbitMQEventPublisher
)
