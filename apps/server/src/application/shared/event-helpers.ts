// src/application/shared/event-helpers.ts

import { Schedule } from 'effect'
import { type Effect, gen, retry, catchAll, logError, annotateLogs } from 'effect/Effect'

import type { DomainEvent } from '../../domain'
import { EventPublisher } from '../../ports/driven'

// ============================================
// EVENT PUBLISHING WITH EXPONENTIAL RETRY
// ============================================

/**
 * Publishes a domain event with bounded exponential retry.
 *
 * Retry strategy: 500ms → 1s → 2s (3 attempts, ~3.5s max latency)
 * If all retries fail, logs CRITICAL error for support intervention.
 *
 * @param event - The domain event to publish
 * @returns Effect<void, never> - Never fails, but may log critical errors
 */
export const publishEvent = (event: DomainEvent): Effect<void, never, EventPublisher> =>
  gen(function* () {
    const publisher = yield* EventPublisher

    yield* publisher.publish(event)
      .pipe(retry(Schedule.exponential('500 millis')
        .pipe(Schedule.intersect(Schedule.recurs(3)))),
      catchAll((error) =>
        logError('EVENT_PUBLISH_FAILED_CRITICAL')
          .pipe(annotateLogs({
            error: String(error.cause),
            eventType: event._tag,
            productId: event.productId,
            correlationId: event.correlationId,
            userId: event.userId,
            timestamp: event.timestamp.toISOString(),
            action: 'MANUAL_REPLAY_REQUIRED',
          }))
      ))
  })
