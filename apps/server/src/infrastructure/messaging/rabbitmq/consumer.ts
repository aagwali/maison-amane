// src/infrastructure/messaging/rabbitmq/consumer.ts

import { Duration, Effect, Fiber, Runtime } from 'effect'
import { RabbitMQConnection } from '@maison-amane/shared-kernel'
import type * as amqp from 'amqplib'

import { RabbitMQConfig } from '../../../composition/config'
import type { DomainEvent } from '../../../domain/events'
import {
  MessageHandlerError,
  MessageParseError,
  MessageTimeoutError,
  type MessageHandler,
} from '../../../ports/driven'

import { buildQueueNames, calculateDelay, getRetryCount } from './topology'

// Re-export for backwards compatibility during migration
export { MessageHandlerError, MessageParseError, MessageTimeoutError, type MessageHandler }

// ============================================
// DESERIALIZE MESSAGE
// ============================================

const deserializeEvent = (
  msg: amqp.ConsumeMessage
): Effect.Effect<DomainEvent, MessageParseError> =>
  Effect.try({
    try: () => {
      const content = msg.content.toString()
      const parsed = JSON.parse(content)

      // Validation minimale de version
      if (typeof parsed._version !== 'number') {
        throw new Error(`Missing or invalid _version field in event: ${parsed._tag}`)
      }

      return {
        ...parsed,
        timestamp: new Date(parsed.timestamp),
      } as DomainEvent
    },
    catch: (error) => new MessageParseError({ rawMessage: msg.content.toString(), cause: error }),
  })

// ============================================
// HELLO WORLD HANDLER (for testing)
// ============================================

export const helloWorldHandler: MessageHandler = (event) =>
  Effect.gen(function* () {
    yield* Effect.logInfo('Hello from consumer! Event received').pipe(
      Effect.annotateLogs({
        eventType: event._tag,
        productId: event.productId,
        correlationId: event.correlationId,
      }),
      Effect.withLogSpan('consumer.helloWorld')
    )
  })

// ============================================
// START CONSUMER
// Implements retry with exponential backoff + DLQ
// ============================================

export const startConsumer = <E extends DomainEvent, R>(
  consumerName: string,
  handler: MessageHandler<E, R>
) =>
  Effect.gen(function* () {
    const { channel } = yield* RabbitMQConnection
    const config = yield* RabbitMQConfig
    const runtime = yield* Effect.runtime<R>()
    const runFork = Runtime.runFork(runtime)
    const queues = buildQueueNames(consumerName)

    yield* Effect.sync(() => {
      channel.consume(
        queues.main,
        async (msg) => {
          if (!msg) return

          const fiber = runFork(
            Effect.gen(function* () {
              const event = yield* deserializeEvent(msg)
              const retryCount = getRetryCount(msg, queues.retry)

              yield* Effect.logDebug('Processing message').pipe(
                Effect.annotateLogs({
                  retryCount,
                  maxAttempts: config.retry.maxAttempts,
                })
              )

              const handleWithTimeout = handler(event as E).pipe(
                Effect.timeoutFail({
                  duration: Duration.millis(config.handlerTimeoutMs),
                  onTimeout: () =>
                    new MessageTimeoutError({
                      event,
                      timeoutMs: config.handlerTimeoutMs,
                    }),
                })
              )

              yield* handleWithTimeout.pipe(
                Effect.matchEffect({
                  onSuccess: () => Effect.sync(() => channel.ack(msg)),
                  onFailure: (error) =>
                    Effect.gen(function* () {
                      const errorMessage =
                        error._tag === 'MessageTimeoutError'
                          ? `Handler timeout after ${error.timeoutMs}ms`
                          : String(error.cause)

                      yield* Effect.logWarning('Handler failed').pipe(
                        Effect.annotateLogs({
                          error: errorMessage,
                          errorType: error._tag,
                          retryCount,
                        })
                      )

                      if (retryCount >= config.retry.maxAttempts - 1) {
                        // Max retries reached → send to DLQ
                        yield* Effect.logError('Max retries reached, sending to DLQ').pipe(
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

                        yield* Effect.logInfo('Scheduling retry').pipe(
                          Effect.annotateLogs({
                            nextRetryIn: `${delay}ms`,
                            attempt: retryCount + 2,
                            maxAttempts: config.retry.maxAttempts,
                          })
                        )

                        // Publish to retry queue with TTL
                        yield* Effect.sync(() => {
                          channel.publish(
                            '', // Default exchange
                            queues.retry,
                            msg.content,
                            {
                              persistent: true,
                              headers: {
                                ...msg.properties.headers,
                                'x-death': msg.properties.headers?.['x-death'],
                              },
                              expiration: String(delay),
                            }
                          )
                          channel.ack(msg)
                        })
                      }
                    }),
                })
              )
            }).pipe(
              Effect.catchAll((parseError) =>
                Effect.gen(function* () {
                  yield* Effect.logError('Failed to parse message').pipe(
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

    yield* Effect.logInfo('Consumer started').pipe(
      Effect.annotateLogs({
        consumer: consumerName,
        queue: queues.main,
        maxRetries: config.retry.maxAttempts,
        handlerTimeoutMs: config.handlerTimeoutMs,
      }),
      Effect.withLogSpan('consumer.start')
    )
  })
