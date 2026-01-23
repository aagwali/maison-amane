// src/main.ts

import { NodeRuntime } from '@effect/platform-node'
import { Effect, Layer, Logger, LogLevel } from 'effect'
import { AppConfig, HttpLive } from './composition'
import { JsonLogger, PrettyLogger } from './infrastructure'

// ============================================
// SERVER ENTRY POINT
// ============================================

const logLevelMap = {
  debug: LogLevel.Debug,
  info: LogLevel.Info,
  warn: LogLevel.Warning,
  error: LogLevel.Error
} as const

const program = Effect.gen(function* () {
  const { nodeEnv, logLevel } = yield* AppConfig

  const isDev = nodeEnv !== 'production'
  const minLevel = Logger.minimumLogLevel(logLevelMap[logLevel])

  const LoggerLive = isDev
    ? Layer.mergeAll(
        Logger.replace(Logger.defaultLogger, PrettyLogger),
        minLevel
      )
    : Layer.mergeAll(
        Logger.replace(Logger.defaultLogger, JsonLogger),
        minLevel
      )

  const MainLive = HttpLive.pipe(Layer.provide(LoggerLive))

  return yield* Layer.launch(MainLive)
})

NodeRuntime.runMain(program)
