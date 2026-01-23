// src/composition/layers/http.layer.ts

import { HttpApiBuilder, HttpMiddleware, HttpServer } from '@effect/platform'
import { NodeHttpServer } from '@effect/platform-node'
import { Layer } from 'effect'
import { createServer } from 'node:http'
import { MaisonAmaneApi } from '@maison-amane/api'
import { PilotProductHandlerLive, SystemHandlerLive } from '../../infrastructure/http'
import { DevelopmentLayer } from './development.layer'

// ============================================
// API LAYER
// ============================================

export const ApiLive = HttpApiBuilder.api(MaisonAmaneApi).pipe(
  Layer.provide(PilotProductHandlerLive),
  Layer.provide(SystemHandlerLive),
  Layer.provide(DevelopmentLayer)
)

// ============================================
// HTTP SERVER LAYER
// ============================================

export const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiBuilder.middlewareCors()),
  Layer.provide(ApiLive),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 }))
)
