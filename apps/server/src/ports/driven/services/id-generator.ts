// src/ports/driven/services/id-generator.ts

import { Context, Effect } from 'effect'

import type { ProductId } from "../../../domain/pilot"

// ============================================
// ID GENERATOR
// ============================================

export interface IdGeneratorService {
  readonly generateProductId: () => Effect.Effect<ProductId>
  readonly generateCorrelationId: () => Effect.Effect<string>
}

export class IdGenerator extends Context.Tag("IdGenerator")<
  IdGenerator,
  IdGeneratorService
>() {}
