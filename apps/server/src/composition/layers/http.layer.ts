// src/composition/layers/http.layer.ts

import { Effect, Layer } from 'effect'
import { createServer } from 'node:http'

import { HttpApiBuilder, HttpMiddleware, HttpServer } from '@effect/platform'
import { NodeHttpServer } from '@effect/platform-node'
import { MaisonAmaneApi } from '@maison-amane/api'

import {
  PilotProductHandlerLive,
  SystemHandlerLive,
} from '../../infrastructure/http'
import { AppConfig } from '../config'
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

const HttpServerLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const { port } = yield* AppConfig
    return NodeHttpServer.layer(createServer, { port })
  })
)

export const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiBuilder.middlewareCors()),
  Layer.provide(ApiLive),
  HttpServer.withLogAddress,
  Layer.provide(HttpServerLive)
)
