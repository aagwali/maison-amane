// src/infrastructure/services/request-context.ts

import { Context, Effect, FiberRef, Layer } from 'effect'

// ============================================
// REQUEST CONTEXT
// Holds correlationId and userId for the current request
// Propagated through the Effect fiber
// ============================================

export interface RequestContextValue {
  readonly correlationId: string
  readonly userId: string
  readonly startTime: Date
}

const defaultRequestContext: RequestContextValue = {
  correlationId: "no-correlation-id",
  userId: "anonymous",
  startTime: new Date(),
}

// FiberRef to hold request context throughout the request lifecycle
export const RequestContextRef = FiberRef.unsafeMake<RequestContextValue>(defaultRequestContext)

// ============================================
// REQUEST CONTEXT SERVICE
// ============================================

export interface RequestContextService {
  readonly get: Effect.Effect<RequestContextValue>
  readonly set: (ctx: RequestContextValue) => Effect.Effect<void>
}

export class RequestContext extends Context.Tag("RequestContext")<
  RequestContext,
  RequestContextService
>() {}

export const RequestContextLive = Layer.succeed(
  RequestContext,
  {
    get: FiberRef.get(RequestContextRef),
    set: (ctx: RequestContextValue) => FiberRef.set(RequestContextRef, ctx),
  }
)

// ============================================
// HELPER: Run effect with request context
// ============================================

export const withRequestContext = <A, E, R>(
  ctx: RequestContextValue,
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> =>
  Effect.locally(RequestContextRef, ctx)(effect)

// ============================================
// HELPER: Annotate logs with current request context
// ============================================
// USE CASE: Pour ajouter automatiquement correlationId/userId aux logs
// dans des couches profondes (repositories, services) sans passer
// explicitement le contexte. Le FiberRef propage le contexte dans la fiber.

export const withRequestContextLogs = <A, E, R>(
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> =>
  Effect.gen(function* () {
    const ctx = yield* FiberRef.get(RequestContextRef)
    return yield* Effect.annotateLogs(effect, {
      correlationId: ctx.correlationId,
      userId: ctx.userId,
    })
  })

// ============================================
// HELPER: Combined observability wrapper
// ============================================
// Combines: request context propagation + log annotations + span

export const withObservability = <A, E, R>(
  ctx: RequestContextValue,
  spanName: string,
  endpoint: string,
  effect: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> =>
  effect.pipe(
    Effect.withLogSpan(spanName),
    (eff) => withRequestContext(ctx, eff),
    Effect.annotateLogs({
      correlationId: ctx.correlationId,
      userId: ctx.userId,
      endpoint,
    })
  )
