// src/infrastructure/services/console-event-publisher.ts

import { Effect, Layer } from "effect"
import type { PilotDomainEvent } from "../../domain/pilot"
import { EventPublisher } from "../../ports/driven"

// ============================================
// CONSOLE EVENT PUBLISHER (for development)
// Uses structured logging with context propagation
// ============================================

export const ConsoleEventPublisherLive = Layer.succeed(
  EventPublisher,
  {
    publish: (event: PilotDomainEvent) =>
      Effect.logInfo("Domain event published").pipe(
        Effect.annotateLogs({
          eventType: event._tag,
          productId: event.productId,
          correlationId: event.correlationId,
          userId: event.userId,
        }),
        Effect.withLogSpan("eventPublisher")
      )
  }
)
