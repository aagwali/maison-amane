// src/infrastructure/services/uuid-id-generator.ts

import { Layer } from 'effect'
import { succeed } from 'effect/Effect'
import { v4 as uuidv4 } from 'uuid'

import { makeProductId } from '../../domain/pilot'
import { makeMediaId } from '../../domain/media'
import { IdGenerator } from '../../ports/driven'

// ============================================
// UUID ID GENERATOR
// ============================================

export const UuidIdGeneratorLive = Layer.succeed(IdGenerator, {
  generateProductId: () => succeed(makeProductId(uuidv4())),
  generateMediaId: () => succeed(makeMediaId(uuidv4())),
  generateCorrelationId: () => succeed(uuidv4()),
})
