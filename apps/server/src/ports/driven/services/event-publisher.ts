// src/ports/driven/services/event-publisher.ts

import { Context, Data, Effect } from 'effect'

import type { PilotDomainEvent } from "../../../domain/pilot"

// ============================================
// EVENT PUBLISHER ERROR
// ============================================

export class EventPublishError extends Data.TaggedError("EventPublishError")<{
  readonly event: PilotDomainEvent
  readonly cause: unknown
}> {}

// ============================================
// EVENT PUBLISHER
// ============================================

export interface EventPublisherService {
  readonly publish: (event: PilotDomainEvent) => Effect.Effect<void, EventPublishError>
}

export class EventPublisher extends Context.Tag("EventPublisher")<
  EventPublisher,
  EventPublisherService
>() {}
