// packages/api/src/dtos/pilot-product.request.ts

import { Schema as S } from 'effect'

// ============================================
// VARIANT REQUEST DTO
// ============================================

export const VariantRequestDto = S.Struct({
  size: S.String,
  customDimensions: S.optional(
    S.Struct({
      width: S.Number,
      length: S.Number,
    })
  ),
  price: S.optional(S.Number),
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
  category: S.String,
  description: S.String,
  priceRange: S.String,
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
  category: S.optional(S.String),
  description: S.optional(S.String),
  priceRange: S.optional(S.String),
  variants: S.optional(S.Array(VariantRequestDto)),
  views: S.optional(S.Array(ViewRequestDto)),
  status: S.optional(S.String),
})

export type UpdatePilotProductRequest = S.Schema.Type<typeof UpdatePilotProductRequest>
