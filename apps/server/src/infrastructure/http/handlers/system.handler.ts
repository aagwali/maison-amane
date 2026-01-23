// src/infrastructure/http/handlers/system.handler.ts

import { Effect } from 'effect'

import { HttpApiBuilder } from '@effect/platform'
import { MaisonAmaneApi } from '@maison-amane/api'

// ============================================
// SYSTEM HTTP HANDLER (Health Check)
// ============================================

export const SystemHandlerLive = HttpApiBuilder.group(
  MaisonAmaneApi,
  'system',
  (handlers) =>
    handlers.handle('health', () =>
      Effect.gen(function* () {
        // TODO: Add real database health check when MongoDB is configured
        const now = new Date().toISOString()

        return {
          status: "ok" as const,
          timestamp: now,
          services: {
            database: "not_configured" as const,
          },
        }
      })
    )
)
