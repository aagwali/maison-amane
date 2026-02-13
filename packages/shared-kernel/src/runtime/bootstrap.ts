// src/runtime/bootstrap.ts

import { Config, Layer, Logger, LogLevel } from 'effect'
import { gen } from 'effect/Effect'
import { withDefault } from 'effect/Config'

// ============================================
// BOOTSTRAP CONFIGURATION SCHEMA
// ============================================

/**
 * Base configuration schema shared by all apps (server, consumers).
 * Reads NODE_ENV and LOG_LEVEL from environment variables.
 */
export const BootstrapConfig = Config.all({
  nodeEnv: Config.literal(
    'development',
    'production',
    'test'
  )('NODE_ENV')
    .pipe(withDefault('development')),
  logLevel: Config.literal('debug', 'info', 'warn', 'error')('LOG_LEVEL')
    .pipe(withDefault('info')),
})

// ============================================
// ENVIRONMENT HELPERS
// ============================================

/**
 * Determines if the environment is development.
 * Used to select appropriate logger and other environment-specific behavior.
 */
export const isDevelopment = (nodeEnv: 'development' | 'production' | 'test'): boolean =>
  nodeEnv !== 'production'

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
// LOGGER FACTORY
// ============================================

/**
 * Creates an environment-aware logger layer (low-level).
 * Prefer using `createLoggerLive` for automatic config injection.
 *
 * @internal
 */
export const createLoggerLayer = (
  isDevelopment: boolean,
  logLevel: 'debug' | 'info' | 'warn' | 'error',
  prettyLogger: Logger.Logger<unknown, unknown>,
  jsonLogger: Logger.Logger<unknown, unknown>
): Layer.Layer<never> => {
  const minLevel = Logger.minimumLogLevel(logLevelMap[logLevel])
  const logger = isDevelopment ? prettyLogger : jsonLogger

  return Layer.mergeAll(Logger.replace(Logger.defaultLogger, logger), minLevel)
}

/**
 * Creates a complete logger layer with automatic BootstrapConfig injection.
 *
 * - Development: Uses pretty logger with colors and formatting
 * - Production: Uses JSON logger for structured logging
 * - Automatically reads NODE_ENV and LOG_LEVEL from environment
 *
 * @param prettyLogger - Pretty logger implementation for development
 * @param jsonLogger - JSON logger implementation for production
 * @returns Logger Layer configured from environment
 *
 * @example
 * ```typescript
 * import { PrettyLogger, JsonLogger } from '@maison-amane/server'
 * import { createLoggerLive } from '@maison-amane/shared-kernel'
 *
 * const LoggerLive = createLoggerLive(PrettyLogger, JsonLogger)
 * ```
 */
export const createLoggerLive = (
  prettyLogger: Logger.Logger<unknown, unknown>,
  jsonLogger: Logger.Logger<unknown, unknown>
) =>
  Layer.unwrapEffect(
    gen(function* () {
      const { nodeEnv, logLevel } = yield* BootstrapConfig
      return createLoggerLayer(isDevelopment(nodeEnv), logLevel, prettyLogger, jsonLogger)
    })
  )
