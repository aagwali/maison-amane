// src/ports/driven/services/event-publisher.ts

import { Context, Effect } from "effect"
import type { PilotDomainEvent } from "../../../domain/pilot"

// ============================================
// EVENT PUBLISHER
// ============================================

export interface EventPublisher {
  readonly publish: (event: PilotDomainEvent) => Effect.Effect<void>
}

export const EventPublisher = Context.GenericTag<EventPublisher>("EventPublisher")
