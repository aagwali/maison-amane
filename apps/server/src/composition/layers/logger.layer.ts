// src/composition/layers/logger.layer.ts

import { Layer } from 'effect'
import { gen } from 'effect/Effect'
import { BootstrapConfig, createLoggerLayer } from '@maison-amane/shared-kernel'

import { JsonLogger, PrettyLogger } from '../../infrastructure'

// ============================================
// LOGGER LAYER (config-driven)
// ============================================

export const LoggerLive = Layer.unwrapEffect(
  gen(function* () {
    const { nodeEnv, logLevel } = yield* BootstrapConfig

    return createLoggerLayer(nodeEnv !== 'production', logLevel, PrettyLogger, JsonLogger)
  })
)
