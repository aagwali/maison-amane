// src/infrastructure/services/uuid-id-generator.ts

import { Effect, Layer } from 'effect'
import { v4 as uuidv4 } from 'uuid'

import { makeProductId } from '../../domain/pilot'
import { IdGenerator } from '../../ports/driven'

// ============================================
// UUID ID GENERATOR
// ============================================

export const UuidIdGeneratorLive = Layer.succeed(IdGenerator, {
  generateProductId: () => Effect.succeed(makeProductId(uuidv4())),
  generateCorrelationId: () => Effect.succeed(uuidv4()),
})
