// src/test-utils/spy-event-publisher.ts
//
// TEST UTILITY: Captures published events for test assertions.
// Access emitted events via publisher.events after running the effect.

import { Effect, Layer } from 'effect'

import { EventPublisher } from '../ports/driven'

import type { DomainEvent } from "../domain"

export const spyEventPublisher = () => {
  const events: DomainEvent[] = []

  return {
    publish: (event: DomainEvent) =>
      Effect.sync(() => {
        events.push(event)
      }),

    // Test helpers
    get emittedEvents(): readonly DomainEvent[] {
      return events
    },

    get lastEvent(): DomainEvent | undefined {
      return events[events.length - 1]
    },

    hasEmitted(tag: DomainEvent["_tag"]): boolean {
      return events.some((e) => e._tag === tag)
    },

    clear(): void {
      events.length = 0
    },
  }
}

export type SpyEventPublisher = ReturnType<typeof spyEventPublisher>

export const SpyEventPublisherLive = () => {
  const spy = spyEventPublisher()
  return {
    layer: Layer.succeed(EventPublisher, spy),
    spy,
  }
}
