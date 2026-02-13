// src/infrastructure/services/console-event-publisher.ts

import { Layer } from 'effect'
import { type Effect, logInfo, annotateLogs, withLogSpan, asVoid } from 'effect/Effect'

import { EventPublisher, EventPublishError } from '../../../ports/driven'
import type { DomainEvent } from '../../../domain'

// ============================================
// CONSOLE EVENT PUBLISHER (for development)
// Uses structured logging with context propagation
// ============================================

export const ConsoleEventPublisherLive = Layer.succeed(EventPublisher, {
  publish: (event: DomainEvent): Effect<void, EventPublishError> =>
    logInfo('Domain event published')
      .pipe(annotateLogs({
        eventType: event._tag,
        productId: event.productId,
        correlationId: event.correlationId,
        userId: event.userId,
      }),
      withLogSpan('eventPublisher'),
      asVoid),
})
