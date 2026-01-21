// src/infrastructure/services/uuid-id-generator.ts

import { Effect, Layer } from "effect"
import { v4 as uuidv4 } from "uuid"
import { MakeProductId, MakeVariantId } from "../../domain/pilot"
import { IdGenerator } from "../../ports/driven"

// ============================================
// UUID ID GENERATOR
// ============================================

export const UuidIdGeneratorLive = Layer.succeed(
  IdGenerator,
  {
    generateProductId: () => Effect.succeed(MakeProductId(uuidv4())),
    generateVariantId: () => Effect.succeed(MakeVariantId(uuidv4()))
  }
)
