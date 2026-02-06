// src/infrastructure/http/helpers/command-context.ts

import { Effect } from 'effect'

import { IdGenerator } from '../../../ports/driven'

// ============================================
// COMMAND CONTEXT GENERATION
// ============================================

export interface CommandContext {
  correlationId: string
  userId: string
  startTime: Date
}

export interface ErrorContext {
  correlationId: string
  instance: string
}

export interface GeneratedContext {
  correlationId: string
  userId: string
  ctx: CommandContext
  errorCtx: ErrorContext
}

/**
 * Generates standard context for HTTP command handlers.
 *
 * This helper eliminates boilerplate by:
 * - Generating a unique correlation ID
 * - Creating observability context with timestamp
 * - Creating error context with instance path
 * - Using system user ID (TODO : extract from auth)
 *
 * @param instance - The resource instance path (e.g., "/api/v1/pilot-products" or "/api/v1/pilot-products/123")
 * @returns Effect that provides the generated context
 *
 * @example
 * ```typescript
 * const { correlationId, userId, ctx, errorCtx } = yield* generateCommandContext(FullPaths.PILOT_PRODUCT)
 * ```
 */
export const generateCommandContext = (
  instance: string
): Effect.Effect<GeneratedContext, never, IdGenerator> =>
  Effect.gen(function* () {
    const idGen = yield* IdGenerator
    const correlationId = yield* idGen.generateCorrelationId()
    const userId = 'system' // TODO : Extract from auth context

    return {
      correlationId,
      userId,
      ctx: { correlationId, userId, startTime: new Date() },
      errorCtx: { correlationId, instance },
    }
  })
