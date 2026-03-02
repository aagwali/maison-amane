// packages/api/src/dtos/pilot-product.request.ts

import { Schema as S } from 'effect'

// ============================================
// VARIANT REQUEST DTO
// ============================================

export const VariantRequestDto = S.Struct({
  size: S.optional(S.String), // 'MEDIUM' | 'LARGE' → CatalogSize
  width: S.optional(S.Number), // BespokeSize
  length: S.optional(S.Number), // BespokeSize
  negotiatedPrice: S.optional(S.Number), // NegotiatedPrice (centimes); absent = FormulaPrice
})

export type VariantRequestDto = S.Schema.Type<typeof VariantRequestDto>

// ============================================
// VIEW REQUEST DTO
// ============================================

export const ViewRequestDto = S.Struct({
  viewType: S.String,
  imageUrl: S.String,
})

export type ViewRequestDto = S.Schema.Type<typeof ViewRequestDto>

// ============================================
// CREATE PILOT PRODUCT REQUEST DTO
// ============================================

export const CreatePilotProductRequest = S.Struct({
  label: S.String,
  type: S.String,
  shape: S.String,
  description: S.String,
  material: S.String,
  variants: S.Array(VariantRequestDto),
  views: S.Array(ViewRequestDto),
  status: S.String,
})

export type CreatePilotProductRequest = S.Schema.Type<typeof CreatePilotProductRequest>

// ============================================
// UPDATE PILOT PRODUCT REQUEST DTO
// ============================================

export const UpdatePilotProductRequest = S.Struct({
  label: S.optional(S.String),
  type: S.optional(S.String),
  shape: S.optional(S.String),
  description: S.optional(S.String),
  material: S.optional(S.String),
  variants: S.optional(S.Array(VariantRequestDto)),
  views: S.optional(S.Array(ViewRequestDto)),
  status: S.optional(S.String),
})

export type UpdatePilotProductRequest = S.Schema.Type<typeof UpdatePilotProductRequest>
