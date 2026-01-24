// src/infrastructure/messaging/rabbitmq/consumer.ts

import { Effect, Fiber, Runtime } from 'effect'

import { RabbitMQConfig } from '../../../composition/config'
import { RabbitMQConnection } from './connection'
import {
  calculateDelay,
  getRetryCount,
  makeQueueNames,
} from './topology'

import type * as amqp from "amqplib"
import type { PilotDomainEvent } from "../../../domain/pilot"
// ============================================
// CONSUMER ERRORS
// ============================================

export class MessageParseError {
  readonly _tag = "MessageParseError"
  constructor(
    readonly rawMessage: string,
    readonly cause: unknown
  ) {}
}

export class MessageHandlerError {
  readonly _tag = "MessageHandlerError"
  constructor(
    readonly event: PilotDomainEvent,
    readonly cause: unknown
  ) {}
}

// ============================================
// DESERIALIZE MESSAGE
// ============================================

const deserializeEvent = (
  msg: amqp.ConsumeMessage
): Effect.Effect<PilotDomainEvent, MessageParseError> =>
  Effect.try({
    try: () => {
      const content = msg.content.toString()
      const parsed = JSON.parse(content)
      return {
        ...parsed,
        timestamp: new Date(parsed.timestamp),
      } as PilotDomainEvent
    },
    catch: (error) => new MessageParseError(msg.content.toString(), error),
  })

// ============================================
// MESSAGE HANDLER TYPE
// ============================================

export type MessageHandler<
  E extends PilotDomainEvent = PilotDomainEvent,
  R = never
> = (event: E) => Effect.Effect<void, MessageHandlerError, R>

// ============================================
// HELLO WORLD HANDLER (for testing)
// ============================================

export const helloWorldHandler: MessageHandler = (event) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Hello from consumer! Event received").pipe(
      Effect.annotateLogs({
        eventType: event._tag,
        productId: event.productId,
        correlationId: event.correlationId,
      }),
      Effect.withLogSpan("consumer.helloWorld")
    )
  })

// ============================================
// START CONSUMER
// Implements retry with exponential backoff + DLQ
// ============================================

export const startConsumer = <E extends PilotDomainEvent, R>(
  consumerName: string,
  handler: MessageHandler<E, R>
) =>
  Effect.gen(function* () {
    const { channel } = yield* RabbitMQConnection
    const config = yield* RabbitMQConfig
    const runtime = yield* Effect.runtime<R>()
    const runFork = Runtime.runFork(runtime)
    const queues = makeQueueNames(consumerName)

    yield* Effect.sync(() => {
      channel.consume(
        queues.main,
        async (msg) => {
          if (!msg) return

          const fiber = runFork(
            Effect.gen(function* () {
              const event = yield* deserializeEvent(msg)
              const retryCount = getRetryCount(msg, queues.retry)

              yield* Effect.logDebug("Processing message").pipe(
                Effect.annotateLogs({
                  retryCount,
                  maxAttempts: config.retry.maxAttempts,
                })
              )

              yield* handler(event as E).pipe(
                Effect.catchAll((error) =>
                  Effect.gen(function* () {
                    yield* Effect.logWarning("Handler failed").pipe(
                      Effect.annotateLogs({
                        error: String(error.cause),
                        retryCount,
                      })
                    )

                    if (retryCount >= config.retry.maxAttempts - 1) {
                      // Max retries reached → send to DLQ
                      yield* Effect.logError(
                        "Max retries reached, sending to DLQ"
                      ).pipe(
                        Effect.annotateLogs({
                          queue: queues.dlq,
                        })
                      )
                      // Reject without requeue → goes to DLX → DLQ
                      yield* Effect.sync(() => channel.nack(msg, false, false))
                    } else {
                      // Retry with exponential backoff
                      const delay = calculateDelay(
                        retryCount,
                        config.retry.initialDelayMs,
                        config.retry.multiplier
                      )

                      yield* Effect.logInfo("Scheduling retry").pipe(
                        Effect.annotateLogs({
                          nextRetryIn: `${delay}ms`,
                          attempt: retryCount + 2,
                          maxAttempts: config.retry.maxAttempts,
                        })
                      )

                      // Publish to retry queue with TTL
                      yield* Effect.sync(() => {
                        channel.publish(
                          "", // Default exchange
                          queues.retry,
                          msg.content,
                          {
                            persistent: true,
                            headers: {
                              ...msg.properties.headers,
                              "x-death": msg.properties.headers?.["x-death"],
                            },
                            expiration: String(delay),
                          }
                        )
                        channel.ack(msg)
                      })
                    }
                  })
                )
              )

              // Success → acknowledge
              yield* Effect.sync(() => channel.ack(msg))
            }).pipe(
              Effect.catchAll((parseError) =>
                Effect.gen(function* () {
                  yield* Effect.logError("Failed to parse message").pipe(
                    Effect.annotateLogs({ error: String(parseError) })
                  )
                  // Invalid message → send to DLQ directly
                  channel.nack(msg, false, false)
                })
              )
            )
          )

          await Fiber.await(fiber).pipe(Effect.runPromise)
        },
        { noAck: false }
      )
    })

    yield* Effect.logInfo("Consumer started").pipe(
      Effect.annotateLogs({
        consumer: consumerName,
        queue: queues.main,
        maxRetries: config.retry.maxAttempts,
      }),
      Effect.withLogSpan("consumer.start")
    )
  })
