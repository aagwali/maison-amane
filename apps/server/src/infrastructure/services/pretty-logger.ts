// src/infrastructure/services/pretty-logger.ts

import { Cause, FiberId, HashMap, List, Logger, LogLevel } from 'effect'

// ============================================
// PRETTY LOGGER (for development)
// Human-readable colored output
// ============================================

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
}

const levelColors: Record<string, string> = {
  TRACE: colors.dim,
  DEBUG: colors.cyan,
  INFO: colors.green,
  WARNING: colors.yellow,
  ERROR: colors.red,
  FATAL: colors.red,
}

const formatLevel = (level: LogLevel.LogLevel): string => {
  const label = level.label.toUpperCase().padEnd(5)
  const color = levelColors[level.label.toUpperCase()] || colors.reset
  return `${color}${label}${colors.reset}`
}

const formatTime = (date: Date): string => {
  const time = date.toLocaleTimeString('fr-FR', { hour12: false })
  return `${colors.dim}${time}${colors.reset}`
}

const formatFiberId = (fiberId: FiberId.FiberId): string => {
  if (fiberId._tag === 'None') return ''
  if (fiberId._tag === 'Runtime') return `${colors.dim}#${fiberId.id}${colors.reset}`
  return ''
}

const formatSpans = (spans: List.List<{ label: string }>): string => {
  const labels: string[] = []
  List.forEach(spans, (span) => labels.push(span.label))
  if (labels.length === 0) return ''
  return `${colors.magenta}[${labels.join(' > ')}]${colors.reset} `
}

const formatAnnotations = (annotations: HashMap.HashMap<string, unknown>): string => {
  const entries: string[] = []
  HashMap.forEach(annotations, (value, key) => {
    entries.push(`${colors.blue}${key}${colors.reset}=${value}`)
  })
  if (entries.length === 0) return ''
  return `\n    ${entries.join(' ')}`
}

const formatCause = (cause: Cause.Cause<unknown>): string => {
  if (Cause.isEmpty(cause)) return ''
  return `\n    ${colors.red}${Cause.pretty(cause)}${colors.reset}`
}

export const PrettyLogger = Logger.make<unknown, void>(
  ({ logLevel, message, cause, date, annotations, spans, fiberId }) => {
    const time = formatTime(date)
    const level = formatLevel(logLevel)
    const fiber = formatFiberId(fiberId)
    const spanStr = formatSpans(spans)
    const msg = typeof message === 'string' ? message : JSON.stringify(message)
    const annot = formatAnnotations(annotations)
    const err = formatCause(cause)

    console.log(`${time} ${level} ${fiber} ${spanStr}${msg}${annot}${err}`)
  }
)
