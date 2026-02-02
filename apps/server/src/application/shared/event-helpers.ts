// src/application/shared/event-helpers.ts

import { Effect } from 'effect'

import type { DomainEvent } from '../../domain'
import { EventPublisher } from '../../ports/driven'

// ============================================
// EVENT PUBLISHING WITH RETRY SEMANTICS
// ============================================

/**
 * Publishes a domain event with automatic error logging and retry semantics.
 *
 * This helper ensures that event publishing failures don't cause command failures,
 * as the message broker will automatically retry failed events.
 *
 * @param event - The domain event to publish
 * @returns Effect that logs errors but never fails (Effect<void, never>)
 *
 * @example
 * ```typescript
 * const event = MakePilotProductPublished({ ... })
 * yield* publishEventWithRetry(event)
 * ```
 */
export const publishEventWithRetry = (
  event: DomainEvent
): Effect.Effect<void, never, EventPublisher> =>
  Effect.gen(function* () {
    const publisher = yield* EventPublisher

    yield* publisher.publish(event).pipe(
      Effect.catchAll((error) =>
        Effect.logError('Failed to publish event, will be retried').pipe(
          Effect.annotateLogs({
            error: String(error.cause),
            eventType: event._tag,
          })
        )
      )
    )
  })
