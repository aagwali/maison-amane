// src/ports/driven/services/message-handler.ts
//
// Message handler contracts for event-driven consumers.
// These types define the contract between the messaging infrastructure
// and application-level event handlers.

import { Data, Effect } from 'effect'

import type { PilotDomainEvent } from '../../../domain/pilot'

// ============================================
// MESSAGE HANDLER ERRORS
// ============================================

/**
 * Error thrown when a message handler fails to process an event.
 * The consumer infrastructure uses this to determine retry/DLQ behavior.
 */
export class MessageHandlerError extends Data.TaggedError('MessageHandlerError')<{
  readonly event: PilotDomainEvent
  readonly cause: unknown
}> {}

/**
 * Error thrown when a message handler exceeds its timeout.
 */
export class MessageTimeoutError extends Data.TaggedError('MessageTimeoutError')<{
  readonly event: PilotDomainEvent
  readonly timeoutMs: number
}> {}

/**
 * Error thrown when a message cannot be parsed/deserialized.
 */
export class MessageParseError extends Data.TaggedError('MessageParseError')<{
  readonly rawMessage: string
  readonly cause: unknown
}> {}

// ============================================
// MESSAGE HANDLER TYPE
// ============================================

/**
 * A message handler processes domain events from the message queue.
 *
 * @template E - The specific domain event type this handler processes
 * @template R - The Effect requirements (dependencies) needed by the handler
 */
export type MessageHandler<E extends PilotDomainEvent = PilotDomainEvent, R = never> = (
  event: E
) => Effect.Effect<void, MessageHandlerError, R>
