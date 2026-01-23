// src/composition/layers/logger.layer.ts

import { Effect, Layer, Logger, LogLevel } from 'effect'

import { JsonLogger, PrettyLogger } from '../../infrastructure'
import { AppConfig } from '../config'

// ============================================
// LOG LEVEL MAPPING
// ============================================

const logLevelMap = {
  debug: LogLevel.Debug,
  info: LogLevel.Info,
  warn: LogLevel.Warning,
  error: LogLevel.Error,
} as const

// ============================================
// LOGGER LAYER (config-driven)
// ============================================

export const LoggerLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const { nodeEnv, logLevel } = yield* AppConfig

    const isDev = nodeEnv !== 'production'
    const minLevel = Logger.minimumLogLevel(logLevelMap[logLevel])

    return isDev
      ? Layer.mergeAll(Logger.replace(Logger.defaultLogger, PrettyLogger), minLevel)
      : Layer.mergeAll(Logger.replace(Logger.defaultLogger, JsonLogger), minLevel)
  })
)
