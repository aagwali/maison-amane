// packages/api/src/dtos/pilot-product.response.ts

import { Schema as S } from 'effect'

// ============================================
// VARIANT RESPONSE DTO
// ============================================

export const StandardVariantResponseDto = S.Struct({
  _tag: S.Literal('StandardVariant'),
  id: S.String,
  size: S.String,
})

export const CustomVariantResponseDto = S.Struct({
  _tag: S.Literal('CustomVariant'),
  id: S.String,
  size: S.Literal('CUSTOM'),
  customDimensions: S.Struct({
    width: S.Number,
    length: S.Number,
  }),
  price: S.Number,
})

export const VariantResponseDto = S.Union(StandardVariantResponseDto, CustomVariantResponseDto)

export type VariantResponseDto = S.Schema.Type<typeof VariantResponseDto>

// ============================================
// VIEW RESPONSE DTO
// ============================================

export const ViewResponseDto = S.Struct({
  viewType: S.String,
  imageUrl: S.String,
})

export type ViewResponseDto = S.Schema.Type<typeof ViewResponseDto>

// ============================================
// VIEWS STRUCTURED RESPONSE DTO
// ============================================

export const ViewsResponseDto = S.Struct({
  front: ViewResponseDto,
  detail: ViewResponseDto,
  additional: S.Array(ViewResponseDto),
})

export type ViewsResponseDto = S.Schema.Type<typeof ViewsResponseDto>

// ============================================
// SYNC STATUS RESPONSE DTO
// ============================================

export const NotSyncedResponseDto = S.Struct({
  _tag: S.Literal('NotSynced'),
})

export const SyncedResponseDto = S.Struct({
  _tag: S.Literal('Synced'),
  shopifyProductId: S.String,
  syncedAt: S.String,
})

export const SyncFailedResponseDto = S.Struct({
  _tag: S.Literal('SyncFailed'),
  error: S.Struct({
    code: S.String,
    message: S.String,
    details: S.optional(S.Unknown),
  }),
  failedAt: S.String,
  attempts: S.Number,
})

export const SyncStatusResponseDto = S.Union(
  NotSyncedResponseDto,
  SyncedResponseDto,
  SyncFailedResponseDto
)

export type SyncStatusResponseDto = S.Schema.Type<typeof SyncStatusResponseDto>

// ============================================
// PILOT PRODUCT RESPONSE DTO
// ============================================

export const PilotProductResponse = S.Struct({
  id: S.String,
  label: S.String,
  type: S.String,
  category: S.String,
  description: S.String,
  priceRange: S.String,
  variants: S.NonEmptyArray(VariantResponseDto),
  views: ViewsResponseDto,
  status: S.String,
  syncStatus: SyncStatusResponseDto,
  createdAt: S.String,
  updatedAt: S.String,
})

export type PilotProductResponse = S.Schema.Type<typeof PilotProductResponse>
