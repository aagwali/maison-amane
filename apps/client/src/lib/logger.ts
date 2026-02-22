// Structured logger for server-side code (server actions, route handlers).
// Matches the JSON format of apps/server JsonLogger for consistent log aggregation.
//
// Production → JSON to stdout  { "@timestamp", "level", "message", "service", ...details }
// Development → readable console output

type LogLevel = 'info' | 'warn' | 'error'

type LogDetails = Record<string, unknown>

function emit(level: LogLevel, message: string, details?: LogDetails): void {
  if (process.env.NODE_ENV === 'production') {
    const entry: Record<string, unknown> = {
      '@timestamp': new Date().toISOString(),
      level,
      message,
      service: 'maison-amane-client',
      ...details,
    }
    console[level](JSON.stringify(entry))
  } else {
    console[level](`[${message}]`, details ?? '')
  }
}

export const logger = {
  info: (message: string, details?: LogDetails) => emit('info', message, details),
  warn: (message: string, details?: LogDetails) => emit('warn', message, details),
  error: (message: string, details?: LogDetails) => emit('error', message, details),
}
