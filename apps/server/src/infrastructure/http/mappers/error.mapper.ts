// src/infrastructure/http/mappers/error.mapper.ts

import type { ParseError } from 'effect/ParseResult'

// ============================================
// VALIDATION ERROR FORMATTING
// Extracts readable error details from Schema ParseError
// ============================================

export const formatValidationError = (cause: ParseError): string[] => {
  try {
    const message = cause.message

    // Extract only the meaningful part (path + actual/expected)
    // Schema errors end with the useful info after the last schema definition
    const lines = message.split('\n')
    const meaningfulLines: string[] = []

    for (const line of lines) {
      // Keep lines that show the path (└─) or actual/expected values
      if (
        line.includes('└─') ||
        line.includes('├─') ||
        line.includes('Expected') ||
        line.includes('actual')
      ) {
        // Clean up the line - remove excessive indentation
        meaningfulLines.push(line.trim())
      }
    }

    if (meaningfulLines.length > 0) {
      return meaningfulLines
    }

    return message ? [message] : ['Validation failed']
  } catch {
    return ['Validation failed']
  }
}
