// src/infrastructure/messaging/rabbitmq/consumer.ts

import { Duration, Fiber, Runtime } from 'effect'
import {
  type Effect,
  try as trySync,
  gen,
  logInfo,
  annotateLogs,
  withLogSpan,
  runtime as runtimeEffect,
  sync,
  logDebug,
  timeoutFail,
  matchEffect,
  logWarning,
  logError,
  catchAll,
  runPromise,
} from 'effect/Effect'
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

const deserializeEvent = (msg: amqp.ConsumeMessage): Effect<DomainEvent, MessageParseError> =>
  trySync({
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
  gen(function* () {
    yield* logInfo('Hello from consumer! Event received')
      .pipe(annotateLogs({
        eventType: event._tag,
        productId: event.productId,
        correlationId: event.correlationId,
      }),
      withLogSpan('consumer.helloWorld'))
  })

// ============================================
// START CONSUMER
// Implements retry with exponential backoff + DLQ
// ============================================

export const startConsumer = <E extends DomainEvent, R>(
  consumerName: string,
  handler: MessageHandler<E, R>
) =>
  gen(function* () {
    const { channel } = yield* RabbitMQConnection
    const config = yield* RabbitMQConfig
    const runtime = yield* runtimeEffect<R>()
    const runFork = Runtime.runFork(runtime)
    const queues = buildQueueNames(consumerName)

    yield* sync(() => {
      channel.consume(
        queues.main,
        async (msg) => {
          if (!msg) return

          const fiber = runFork(
            gen(function* () {
              const event = yield* deserializeEvent(msg)
              const retryCount = getRetryCount(msg, queues.retry)

              yield* logDebug('Processing message')
                .pipe(annotateLogs({
                  retryCount,
                  maxAttempts: config.retry.maxAttempts,
                }))

              const handleWithTimeout = handler(event as E)
                .pipe(timeoutFail({
                  duration: Duration.millis(config.handlerTimeoutMs),
                  onTimeout: () =>
                    new MessageTimeoutError({
                      event,
                      timeoutMs: config.handlerTimeoutMs,
                    }),
                }))

              yield* handleWithTimeout
                .pipe(matchEffect({
                  onSuccess: () => sync(() => channel.ack(msg)),
                  onFailure: (error) =>
                    gen(function* () {
                      const errorMessage =
                        error._tag === 'MessageTimeoutError'
                          ? `Handler timeout after ${error.timeoutMs}ms`
                          : String(error.cause)

                      yield* logWarning('Handler failed')
                        .pipe(annotateLogs({
                          error: errorMessage,
                          errorType: error._tag,
                          retryCount,
                        }))

                      if (retryCount >= config.retry.maxAttempts - 1) {
                        // Max retries reached → send to DLQ
                        yield* logError('Max retries reached, sending to DLQ')
                          .pipe(annotateLogs({
                            queue: queues.dlq,
                          }))
                        // Reject without requeue → goes to DLX → DLQ
                        yield* sync(() => channel.nack(msg, false, false))
                      } else {
                        // Retry with exponential backoff
                        const delay = calculateDelay(
                          retryCount,
                          config.retry.initialDelayMs,
                          config.retry.multiplier
                        )

                        yield* logInfo('Scheduling retry')
                          .pipe(annotateLogs({
                            nextRetryIn: `${delay}ms`,
                            attempt: retryCount + 2,
                            maxAttempts: config.retry.maxAttempts,
                          }))

                        // Publish to retry queue with TTL
                        yield* sync(() => {
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
                }))
            })
              .pipe(catchAll((error) =>
                gen(function* () {
                  yield* logError('Failed to parse message')
                    .pipe(annotateLogs({ error: String(error) }))
                  // Invalid message → send to DLQ directly
                  channel.nack(msg, false, false)
                })
              ))
          )

          await Fiber.await(fiber)
            .pipe(runPromise)
        },
        { noAck: false }
      )
    })

    yield* logInfo('Consumer started')
      .pipe(annotateLogs({
          consumer: consumerName,
          queue: queues.main,
          maxRetries: config.retry.maxAttempts,
          handlerTimeoutMs: config.handlerTimeoutMs,
        }))
      .pipe(withLogSpan('consumer.start'))
  })
