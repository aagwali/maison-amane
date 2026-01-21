// src/infrastructure/services/console-event-publisher.ts

import { Effect, Layer } from "effect"
import type { PilotDomainEvent } from "../../domain/pilot"
import { EventPublisher } from "../../ports/driven"

// ============================================
// CONSOLE EVENT PUBLISHER (for development)
// ============================================

export const ConsoleEventPublisherLive = Layer.succeed(
  EventPublisher,
  {
    publish: (event: PilotDomainEvent) =>
      Effect.sync(() => {
        console.log("[Event Published]", event._tag, event.productId)
      })
  }
)
