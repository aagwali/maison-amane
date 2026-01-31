// src/infrastructure/services/console-event-publisher.ts

import { Effect, Layer } from 'effect'

import { EventPublisher, EventPublishError } from '../../../ports/driven'
import type { DomainEvent } from '../../../domain'

// ============================================
// CONSOLE EVENT PUBLISHER (for development)
// Uses structured logging with context propagation
// ============================================

export const ConsoleEventPublisherLive = Layer.succeed(EventPublisher, {
  publish: (event: DomainEvent): Effect.Effect<void, EventPublishError> =>
    Effect.logInfo('Domain event published').pipe(
      Effect.annotateLogs({
        eventType: event._tag,
        productId: event.productId,
        correlationId: event.correlationId,
        userId: event.userId,
      }),
      Effect.withLogSpan('eventPublisher'),
      Effect.asVoid
    ),
})
