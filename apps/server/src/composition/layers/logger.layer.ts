// src/composition/layers/logger.layer.ts

import { createLoggerLive } from '@maison-amane/shared-kernel'

import { JsonLogger, PrettyLogger } from '../../infrastructure'

// ============================================
// LOGGER LAYER (config-driven)
// ============================================

export const LoggerLive = createLoggerLive(PrettyLogger, JsonLogger)
