import { createServer } from 'node:http'

import { Layer } from 'effect'
import { gen } from 'effect/Effect'
import { HttpApiBuilder, HttpMiddleware, HttpServer } from '@effect/platform'
import { NodeHttpServer } from '@effect/platform-node'
import { MaisonAmaneApi } from '@maison-amane/api'

import {
  MediaHandlerLive,
  MongoDatabaseLive,
  PilotProductHandlerLive,
  SystemHandlerLive,
} from '../../infrastructure'
import { AppConfig } from '../config'

import { DevelopmentLayer } from './development.layer'

// ============================================
// API LAYER
// ============================================

export const ApiLive = HttpApiBuilder.api(MaisonAmaneApi)
  .pipe(Layer.provide(PilotProductHandlerLive),
  Layer.provide(MediaHandlerLive),
  Layer.provide(SystemHandlerLive
    .pipe(Layer.provide(MongoDatabaseLive))),
  Layer.provide(DevelopmentLayer))

// ============================================
// HTTP SERVER LAYER
// ============================================

const HttpServerLive = Layer.unwrapEffect(
  gen(function* () {
    const { port } = yield* AppConfig
    return NodeHttpServer.layer(createServer, { port })
  })
)

export const HttpLive = HttpApiBuilder.serve(HttpMiddleware.logger)
  .pipe(Layer.provide(HttpApiBuilder.middlewareCors()),
  Layer.provide(ApiLive),
  HttpServer.withLogAddress,
  Layer.provide(HttpServerLive))
