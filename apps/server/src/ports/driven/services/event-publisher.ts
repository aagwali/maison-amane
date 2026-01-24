// src/ports/driven/services/event-publisher.ts

import { Context, Data, Effect } from 'effect'

import type { DomainEvent } from "../../../domain"

// ============================================
// EVENT PUBLISHER ERROR
// ============================================

export class EventPublishError extends Data.TaggedError("EventPublishError")<{
  readonly event: DomainEvent
  readonly cause: unknown
}> {}

// ============================================
// EVENT PUBLISHER
// ============================================

export interface EventPublisherService {
  readonly publish: (event: DomainEvent) => Effect.Effect<void, EventPublishError>
}

export class EventPublisher extends Context.Tag("EventPublisher")<
  EventPublisher,
  EventPublisherService
>() {}
