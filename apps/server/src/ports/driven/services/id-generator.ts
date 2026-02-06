// src/ports/driven/services/id-generator.ts

import { Context } from 'effect'
import type { Effect } from 'effect/Effect'

import type { ProductId } from '../../../domain/pilot'

// ============================================
// ID GENERATOR
// ============================================

export interface IdGeneratorService {
  readonly generateProductId: () => Effect<ProductId>
  readonly generateCorrelationId: () => Effect<string>
}

export class IdGenerator extends Context.Tag('IdGenerator')<IdGenerator, IdGeneratorService>() {}
