// src/infrastructure/http/handlers/system.handler.ts

import { HttpApiBuilder } from '@effect/platform'
import { MaisonAmaneApi } from '@maison-amane/api'
import { catchAll, gen, map, succeed, tryPromise } from 'effect/Effect'

import { MongoDatabase } from '../../persistence/mongodb/mongo-database'

// ============================================
// SYSTEM HTTP HANDLER (Health Check)
// ============================================

export const SystemHandlerLive = HttpApiBuilder.group(MaisonAmaneApi, 'system', (handlers) =>
  handlers.handle('health', () =>
    gen(function* () {
      const db = yield* MongoDatabase
      const now = new Date().toISOString()

      const dbStatus = yield* tryPromise({
        try: () => db.admin().ping(),
        catch: () => new Error('MongoDB ping failed'),
      })
        .pipe(map(() => 'up' as const))
        .pipe(catchAll(() => succeed('down' as const)))

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
