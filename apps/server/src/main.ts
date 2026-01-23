// src/main.ts

import { NodeRuntime } from '@effect/platform-node'
import { Layer, Logger, LogLevel } from 'effect'
import { HttpLive } from './composition'
import { JsonLogger, PrettyLogger } from './infrastructure'

// ============================================
// SERVER ENTRY POINT
// ============================================

const isDev = process.env.NODE_ENV !== 'production'

// Minimum log level (can be configured via env)
const minLevel = Logger.minimumLogLevel(LogLevel.Info)

// Replace default logger AND set minimum level
const LoggerLive = isDev
  ? Layer.mergeAll(
      Logger.replace(Logger.defaultLogger, PrettyLogger),
      minLevel
    )
  : Layer.mergeAll(
      Logger.replace(Logger.defaultLogger, JsonLogger),
      minLevel
    )

const MainLive = HttpLive.pipe(
  Layer.provide(LoggerLive)
)

NodeRuntime.runMain(Layer.launch(MainLive))
