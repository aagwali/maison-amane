// src/ports/driven/services/event-publisher.ts

import { Context, Effect } from 'effect'

import type { PilotDomainEvent } from "../../../domain/pilot"

// ============================================
// EVENT PUBLISHER ERROR
// ============================================

export class EventPublishError {
  readonly _tag = "EventPublishError"
  constructor(
    readonly event: PilotDomainEvent,
    readonly cause: unknown
  ) {}
}

// ============================================
// EVENT PUBLISHER
// ============================================

export interface EventPublisher {
  readonly publish: (event: PilotDomainEvent) => Effect.Effect<void, EventPublishError>
}

export const EventPublisher = Context.GenericTag<EventPublisher>("EventPublisher")
