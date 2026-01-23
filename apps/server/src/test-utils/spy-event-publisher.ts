// src/test-utils/spy-event-publisher.ts
//
// TEST UTILITY: Captures published events for test assertions.
// Access emitted events via publisher.events after running the effect.

import { Effect, Layer } from "effect"
import { EventPublisher } from "../ports/driven"
import type { PilotDomainEvent } from "../domain/pilot"

export const makeSpyEventPublisher = () => {
  const events: PilotDomainEvent[] = []

  return {
    publish: (event: PilotDomainEvent) =>
      Effect.sync(() => {
        events.push(event)
      }),

    // Test helpers
    get emittedEvents(): readonly PilotDomainEvent[] {
      return events
    },

    get lastEvent(): PilotDomainEvent | undefined {
      return events[events.length - 1]
    },

    hasEmitted(tag: PilotDomainEvent["_tag"]): boolean {
      return events.some((e) => e._tag === tag)
    },

    clear(): void {
      events.length = 0
    },
  }
}

export type SpyEventPublisher = ReturnType<typeof makeSpyEventPublisher>

export const SpyEventPublisherLive = () => {
  const spy = makeSpyEventPublisher()
  return {
    layer: Layer.succeed(EventPublisher, spy),
    spy,
  }
}
