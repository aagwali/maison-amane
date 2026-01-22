// src/domain/pilot/value-objects/dimensions.ts

import * as S from "effect/Schema"
import { PositiveCmSchema } from "./scalar-types"

// ============================================
// CUSTOM DIMENSION
// ============================================

export const CustomDimensionSchema = S.Struct({
  width: PositiveCmSchema,
  length: PositiveCmSchema,
})

export type CustomDimension = typeof CustomDimensionSchema.Type
