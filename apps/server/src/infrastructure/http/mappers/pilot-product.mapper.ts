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
import {
  calculateVariantPrice,
  DIMENSION_SETS,
  type PilotProduct,
  type ProductVariant,
  type SyncStatus,
} from '../../../domain/pilot'

// ============================================
// REQUEST DTO → COMMAND INPUT
// ============================================

const mapVariantDto = (v: CreatePilotProductRequest['variants'][number]) => ({
  size: v.size,
  width: v.width,
  length: v.length,
  negotiatedPrice: v.negotiatedPrice,
})

const mapViewDto = (v: CreatePilotProductRequest['views'][number]) => ({
  viewType: v.viewType,
  imageUrl: v.imageUrl,
})

export const toUnvalidatedProductData = (
  dto: CreatePilotProductRequest
): UnvalidatedProductData => ({
  label: dto.label,
  type: dto.type,
  shape: dto.shape,
  description: dto.description,
  material: dto.material,
  variants: dto.variants.map(mapVariantDto),
  views: dto.views.map(mapViewDto),
  status: dto.status,
})

export const toUnvalidatedUpdateData = (dto: UpdatePilotProductRequest): UnvalidatedUpdateData => ({
  label: dto.label,
  type: dto.type,
  shape: dto.shape,
  description: dto.description,
  material: dto.material,
  variants: dto.variants?.map(mapVariantDto),
  views: dto.views?.map(mapViewDto),
  status: dto.status,
})

// ============================================
// DOMAIN → RESPONSE DTO
// ============================================

const variantToDto = (
  variant: ProductVariant,
  shape: PilotProduct['shape'],
  material: PilotProduct['material']
): VariantResponseDto => {
  const sizeSpec = variant.sizeSpec
  const pricingSpec = variant.pricingSpec

  const computedPrice = calculateVariantPrice(sizeSpec, shape, material)

  const sizeSpecDto =
    sizeSpec._tag === 'CatalogSize'
      ? {
          _tag: 'CatalogSize' as const,
          size: sizeSpec.size,
          dimensions: DIMENSION_SETS[shape][sizeSpec.size]!,
          computedPrice,
        }
      : {
          _tag: 'BespokeSize' as const,
          width: sizeSpec.width,
          length: sizeSpec.length,
        }

  const pricingSpecDto =
    pricingSpec._tag === 'NegotiatedPrice'
      ? { _tag: 'NegotiatedPrice' as const, amount: pricingSpec.amount }
      : { _tag: 'FormulaPrice' as const, computedPrice }

  return { sizeSpec: sizeSpecDto, pricingSpec: pricingSpecDto }
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
  shape: product.shape,
  description: product.description,
  material: product.material,
  variants: product.variants.map((v) => variantToDto(v, product.shape, product.material)) as [
    VariantResponseDto,
    ...VariantResponseDto[],
  ],
  views: viewsToDto(product.views),
  status: product.status,
  syncStatus: syncStatusToDto(product.syncStatus),
  createdAt: product.createdAt.toISOString(),
  updatedAt: product.updatedAt.toISOString(),
})
