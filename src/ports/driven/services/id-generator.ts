// src/ports/driven/services/id-generator.ts

import { Context, Effect } from "effect"
import type { ProductId, VariantId } from "../../../domain/pilot"

// ============================================
// ID GENERATOR
// ============================================

export interface IdGenerator {
  readonly generateProductId: () => Effect.Effect<ProductId>
  readonly generateVariantId: () => Effect.Effect<VariantId>
}

export const IdGenerator = Context.GenericTag<IdGenerator>("IdGenerator")
