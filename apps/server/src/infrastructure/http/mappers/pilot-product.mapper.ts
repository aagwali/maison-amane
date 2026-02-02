// src/infrastructure/http/mappers/pilot-product.mapper.ts

import type {
  CreatePilotProductRequest,
  PilotProductResponse,
  SyncStatusResponseDto,
  UpdatePilotProductRequest,
  VariantResponseDto,
  ViewsResponseDto,
} from '@maison-amane/api'

import type {
  UnvalidatedProductData,
  UnvalidatedUpdateData,
} from '../../../application/pilot/commands'
import type { PilotProduct, ProductVariant, SyncStatus } from '../../../domain/pilot'

// ============================================
// REQUEST DTO → COMMAND INPUT
// ============================================

/**
 * Maps a variant from the request DTO to unvalidated command format
 */
const mapVariantDto = (v: CreatePilotProductRequest['variants'][number]) => ({
  size: v.size,
  customDimensions: v.customDimensions,
  price: v.price,
})

/**
 * Maps a view from the request DTO to unvalidated command format
 */
const mapViewDto = (v: CreatePilotProductRequest['views'][number]) => ({
  viewType: v.viewType,
  imageUrl: v.imageUrl,
})

export const toUnvalidatedProductData = (
  dto: CreatePilotProductRequest
): UnvalidatedProductData => ({
  label: dto.label,
  type: dto.type,
  category: dto.category,
  description: dto.description,
  priceRange: dto.priceRange,
  variants: dto.variants.map(mapVariantDto),
  views: dto.views.map(mapViewDto),
  status: dto.status,
})

export const toUnvalidatedUpdateData = (dto: UpdatePilotProductRequest): UnvalidatedUpdateData => ({
  label: dto.label,
  type: dto.type,
  category: dto.category,
  description: dto.description,
  priceRange: dto.priceRange,
  variants: dto.variants?.map(mapVariantDto),
  views: dto.views?.map(mapViewDto),
  status: dto.status,
})

// ============================================
// DOMAIN → RESPONSE DTO
// ============================================

const variantToDto = (variant: ProductVariant): VariantResponseDto => {
  if (variant._tag === 'CustomVariant') {
    return {
      _tag: 'CustomVariant',
      size: 'CUSTOM',
      customDimensions: {
        width: variant.customDimensions.width,
        length: variant.customDimensions.length,
      },
      price: variant.price,
    }
  }
  return {
    _tag: 'StandardVariant',
    size: variant.size,
  }
}

const syncStatusToDto = (syncStatus: SyncStatus): SyncStatusResponseDto => {
  switch (syncStatus._tag) {
    case 'NotSynced':
      return { _tag: 'NotSynced' }
    case 'Synced':
      return {
        _tag: 'Synced',
        shopifyProductId: syncStatus.shopifyProductId,
        syncedAt: syncStatus.syncedAt.toISOString(),
      }
    case 'SyncFailed':
      return {
        _tag: 'SyncFailed',
        error: {
          code: syncStatus.error.code,
          message: syncStatus.error.message,
          details: syncStatus.error.details,
        },
        failedAt: syncStatus.failedAt.toISOString(),
        attempts: syncStatus.attempts,
      }
  }
}

const viewsToDto = (views: PilotProduct['views']): ViewsResponseDto => ({
  front: {
    viewType: views.front.viewType,
    imageUrl: views.front.imageUrl,
  },
  detail: {
    viewType: views.detail.viewType,
    imageUrl: views.detail.imageUrl,
  },
  additional: views.additional.map((v) => ({
    viewType: v.viewType,
    imageUrl: v.imageUrl,
  })),
})

export const toResponse = (product: PilotProduct): PilotProductResponse => ({
  id: product.id,
  label: product.label,
  type: product.type,
  category: product.category,
  description: product.description,
  priceRange: product.priceRange,
  variants: product.variants.map(variantToDto) as [VariantResponseDto, ...VariantResponseDto[]],
  views: viewsToDto(product.views),
  status: product.status,
  syncStatus: syncStatusToDto(product.syncStatus),
  createdAt: product.createdAt.toISOString(),
  updatedAt: product.updatedAt.toISOString(),
})
