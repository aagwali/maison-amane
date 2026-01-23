// src/infrastructure/services/json-logger.ts

import { Logger, LogLevel, HashMap, List, Cause, FiberId } from "effect"

// ============================================
// JSON STRUCTURED LOGGER
// Outputs logs in JSON format for Kibana/ELK
// ============================================

const logLevelToString = (level: LogLevel.LogLevel): string => {
  if (level === LogLevel.Trace) return "trace"
  if (level === LogLevel.Debug) return "debug"
  if (level === LogLevel.Info) return "info"
  if (level === LogLevel.Warning) return "warn"
  if (level === LogLevel.Error) return "error"
  if (level === LogLevel.Fatal) return "fatal"
  return "info"
}

const formatCause = (cause: Cause.Cause<unknown>): string | undefined => {
  if (Cause.isEmpty(cause)) return undefined
  return Cause.pretty(cause)
}

const formatFiberId = (fiberId: FiberId.FiberId): string => {
  if (fiberId._tag === "None") return "none"
  if (fiberId._tag === "Runtime") return `${fiberId.id}-${fiberId.startTimeMillis}`
  if (fiberId._tag === "Composite") return "composite"
  return "unknown"
}

export const JsonLogger = Logger.make<unknown, void>(
  ({ logLevel, message, cause, date, annotations, spans, fiberId }) => {
    const annotationsObj: Record<string, unknown> = {}

    // Convert HashMap annotations to object
    HashMap.forEach(annotations, (value, key) => {
      annotationsObj[key] = value
    })

    // Extract span information
    const spanNames: string[] = []
    List.forEach(spans, (span) => {
      spanNames.push(span.label)
    })

    const logEntry: Record<string, unknown> = {
      "@timestamp": date.toISOString(),
      level: logLevelToString(logLevel),
      message: typeof message === "string" ? message : JSON.stringify(message),
      service: "maison-amane",
      fiberId: formatFiberId(fiberId),
    }

    // Add annotations (correlationId, userId, etc.)
    if (Object.keys(annotationsObj).length > 0) {
      Object.assign(logEntry, annotationsObj)
    }

    // Add spans if present
    if (spanNames.length > 0) {
      logEntry.spans = spanNames
    }

    // Add cause if present (for errors)
    const formattedCause = formatCause(cause)
    if (formattedCause) {
      logEntry.error = formattedCause
    }

    console.log(JSON.stringify(logEntry))
  }
)

// ============================================
// LAYER: Replace default logger with JSON logger
// ============================================

export const JsonLoggerLive = Logger.replace(Logger.defaultLogger, JsonLogger)
