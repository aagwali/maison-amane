// src/infrastructure/http/helpers/observability-wrapper.ts

import { Effect } from 'effect'

import { withObservability } from '../../services'

import type { CommandContext } from './command-context'

// ============================================
// OBSERVABILITY WRAPPER
// ============================================

/**
 * Wraps a command handler with observability and error mapping.
 *
 * This helper provides:
 * - Distributed tracing with correlation ID
 * - Execution timing
 * - Structured error transformation to RFC 7807 Problem Details
 *
 * @template A - Success result type
 * @template E - Error type from the handler
 * @template R - Requirements (Context) needed by the handler
 * @param ctx - Command context with correlation ID and timing
 * @param operationName - Name of the operation for tracing (e.g., "createPilotProduct")
 * @param httpOperation - HTTP operation for logs (e.g., "POST /api/v1/pilot-products")
 * @param handler - The Effect to execute
 * @param errorMapper - Function to map domain errors to Problem Details
 * @returns Effect with observability and mapped errors
 *
 * @example
 * ```typescript
 * const product = yield* executeWithObservability(
 *   ctx,
 *   'createPilotProduct',
 *   `POST ${FullPaths.PILOT_PRODUCT}`,
 *   handlePilotProductCreation(command),
 *   (error) => toProblemDetail(error, errorCtx)
 * )
 * ```
 */
export const executeWithObservability = <A, E, EM, R>(
  ctx: CommandContext,
  operationName: string,
  httpOperation: string,
  handler: Effect.Effect<A, E, R>,
  errorMapper: (error: E) => EM
): Effect.Effect<A, EM, R> =>
  withObservability(ctx, operationName, httpOperation, handler).pipe(Effect.mapError(errorMapper))
