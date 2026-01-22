// src/infrastructure/http/mappers/pilot-product.mapper.ts

import {
  ApiValidationError,
  ApiPersistenceError,
  type CreatePilotProductRequest,
  type PilotProductResponse,
  type VariantResponseDto,
  type ViewsResponseDto,
  type SyncStatusResponseDto,
} from '@maison-amane/api'
import type { UnvalidatedProductData } from '../../../application/pilot/commands'
import type { PilotProduct, ProductVariant, SyncStatus } from '../../../domain/pilot'
import type { ValidationError, PilotProductCreationError } from '../../../domain/pilot'
import type { PersistenceError } from '../../../ports/driven'

// ============================================
// REQUEST DTO → COMMAND INPUT
// ============================================

export const toUnvalidatedProductData = (
  dto: CreatePilotProductRequest
): UnvalidatedProductData => ({
  label: dto.label,
  type: dto.type,
  category: dto.category,
  description: dto.description,
  priceRange: dto.priceRange,
  variants: dto.variants.map((v) => ({
    size: v.size,
    customDimensions: v.customDimensions,
    price: v.price,
  })),
  views: dto.views.map((v) => ({
    viewType: v.viewType,
    imageUrl: v.imageUrl,
  })),
  status: dto.status,
})

// ============================================
// DOMAIN → RESPONSE DTO
// ============================================

const variantToDto = (variant: ProductVariant): VariantResponseDto => {
  if (variant._tag === 'CustomVariant') {
    return {
      _tag: 'CustomVariant',
      id: variant.id,
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
    id: variant.id,
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

// ============================================
// DOMAIN ERRORS → API ERRORS
// ============================================

const isValidationError = (error: PilotProductCreationError): error is ValidationError =>
  '_tag' in error && error._tag === 'ValidationError'

const isPersistenceError = (error: PilotProductCreationError): error is PersistenceError =>
  '_tag' in error && error._tag === 'PersistenceError'

export const toApiError = (
  error: PilotProductCreationError
): ApiValidationError | ApiPersistenceError => {
  if (isValidationError(error)) {
    return new ApiValidationError({
      message: 'Validation failed',
      details: extractValidationDetails(error),
    })
  }

  if (isPersistenceError(error)) {
    return new ApiPersistenceError({
      message: 'Failed to persist pilot product',
    })
  }

  return new ApiPersistenceError({
    message: 'An unexpected error occurred',
  })
}

const extractValidationDetails = (error: ValidationError): string[] => {
  try {
    const message = error.cause.message
    return message ? [message] : ['Validation failed']
  } catch {
    return ['Validation failed']
  }
}
