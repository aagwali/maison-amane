// src/runtime/consumer-bootstrap.ts

import { Config, Layer, Logger, LogLevel } from 'effect'

// ============================================
// CONSUMER CONFIGURATION SCHEMA
// ============================================

/**
 * Standard configuration schema for all consumers.
 * Reads NODE_ENV and LOG_LEVEL from environment variables.
 */
export const ConsumerConfig = Config.all({
  nodeEnv: Config.literal(
    'development',
    'production',
    'test'
  )('NODE_ENV').pipe(Config.withDefault('development')),
  logLevel: Config.literal(
    'debug',
    'info',
    'warn',
    'error'
  )('LOG_LEVEL').pipe(Config.withDefault('info')),
})

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
 * Creates an environment-aware logger layer.
 *
 * - Development: Uses pretty logger with colors and formatting
 * - Production: Uses JSON logger for structured logging
 *
 * @param isDevelopment - Whether to use development logger
 * @param logLevel - Minimum log level to display
 * @param prettyLogger - Pretty logger implementation for development
 * @param jsonLogger - JSON logger implementation for production
 * @returns Logger Layer configured for the environment
 *
 * @example
 * ```typescript
 * const { nodeEnv, logLevel } = yield* ConsumerConfig
 * const LoggerLive = createLoggerLayer(
 *   nodeEnv !== 'production',
 *   logLevel,
 *   PrettyLogger,
 *   JsonLogger
 * )
 * ```
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
