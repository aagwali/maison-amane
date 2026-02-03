// src/composition/layers/logger.layer.ts

import { Effect, Layer } from 'effect'
import { BootstrapConfig, createLoggerLayer } from '@maison-amane/shared-kernel'

import { JsonLogger, PrettyLogger } from '../../infrastructure'

// ============================================
// LOGGER LAYER (config-driven)
// ============================================

export const LoggerLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const { nodeEnv, logLevel } = yield* BootstrapConfig

    return createLoggerLayer(nodeEnv !== 'production', logLevel, PrettyLogger, JsonLogger)
  })
)
