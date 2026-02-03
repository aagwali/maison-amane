// src/infrastructure/http/handlers/system.handler.ts

import { Effect } from 'effect'
import { HttpApiBuilder } from '@effect/platform'
import { MaisonAmaneApi } from '@maison-amane/api'

import { MongoDatabase } from '../../persistence/mongodb/mongo-database'

// ============================================
// SYSTEM HTTP HANDLER (Health Check)
// ============================================

export const SystemHandlerLive = HttpApiBuilder.group(MaisonAmaneApi, 'system', (handlers) =>
  handlers.handle('health', () =>
    Effect.gen(function* () {
      const db = yield* MongoDatabase
      const now = new Date().toISOString()

      const dbStatus = yield* Effect.tryPromise({
        try: () => db.admin().ping(),
        catch: () => new Error('MongoDB ping failed'),
      }).pipe(
        Effect.map(() => 'up' as const),
        Effect.catchAll(() => Effect.succeed('down' as const))
      )

      return {
        status: dbStatus === 'up' ? ('ok' as const) : ('degraded' as const),
        timestamp: now,
        services: {
          database: dbStatus,
        },
      }
    })
  )
)
