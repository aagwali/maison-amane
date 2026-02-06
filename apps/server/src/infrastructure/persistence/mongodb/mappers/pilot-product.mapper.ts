// src/infrastructure/persistence/mongodb/mappers/pilot-product.mapper.ts

import {
  makeImageUrl,
  makePositiveCm,
  makePrice,
  makeProductDescription,
  makeProductId,
  makeProductLabel,
  makeShopifyProductId,
  type PilotProduct,
  type PredefinedSize,
  PriceRange,
  ProductCategory,
  ProductStatus,
  ProductType,
  type ProductVariant,
  Size,
  type SyncStatus,
  ViewType,
} from '../../../../domain/pilot'

// ============================================
// MONGODB DOCUMENT TYPE
// Uses string _id instead of ObjectId
// ============================================

interface PilotProductDocumentSchema {
  _id: string
  label: string
  type: string
  category: string
  description: string
  priceRange: string
  variants: Array<{
    _tag: 'StandardVariant' | 'CustomVariant'
    size: string
    customDimensions?: { width: number; length: number }
    price?: number
  }>
  views: {
    front: { viewType: string; imageUrl: string }
    detail: { viewType: string; imageUrl: string }
    additional: Array<{ viewType: string; imageUrl: string }>
  }
  status: string
  syncStatus: {
    _tag: 'NotSynced' | 'Synced' | 'SyncFailed'
    shopifyProductId?: string
    syncedAt?: Date
    error?: { code: string; message: string; details: unknown }
    failedAt?: Date
    attempts?: number
  }
  createdAt: Date
  updatedAt: Date
}

// Type alias for MongoDB collection
// Explicitly declares this document uses string _id (not ObjectId)
export type PilotProductDocument = PilotProductDocumentSchema

// ============================================
// MAPPER: Domain -> Document
// ============================================

export const pilotToDocument = (product: PilotProduct): PilotProductDocument => ({
  _id: product.id,
  label: product.label,
  type: product.type,
  category: product.category,
  description: product.description,
  priceRange: product.priceRange,
  variants: product.variants.map((v) => ({
    _tag: v._tag,
    size: v.size,
    ...(v._tag === 'CustomVariant'
      ? {
          customDimensions: {
            width: v.customDimensions.width,
            length: v.customDimensions.length,
          },
          price: v.price,
        }
      : {}),
  })),
  views: {
    front: {
      viewType: product.views.front.viewType,
      imageUrl: product.views.front.imageUrl,
    },
    detail: {
      viewType: product.views.detail.viewType,
      imageUrl: product.views.detail.imageUrl,
    },
    additional: product.views.additional.map((v) => ({
      viewType: v.viewType,
      imageUrl: v.imageUrl,
    })),
  },
  status: product.status,
  syncStatus: {
    _tag: product.syncStatus._tag,
    ...(product.syncStatus._tag === 'Synced'
      ? {
          shopifyProductId: product.syncStatus.shopifyProductId,
          syncedAt: product.syncStatus.syncedAt,
        }
      : {}),
    ...(product.syncStatus._tag === 'SyncFailed'
      ? {
          error: product.syncStatus.error,
          failedAt: product.syncStatus.failedAt,
          attempts: product.syncStatus.attempts,
        }
      : {}),
  } as PilotProductDocument['syncStatus'],
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
})

// ============================================
// MAPPER: Document -> Domain
// ============================================

export const pilotFromDocument = (doc: PilotProductDocument): PilotProduct => ({
  _tag: 'PilotProduct',
  id: makeProductId(doc._id),
  label: makeProductLabel(doc.label),
  type: doc.type as ProductType,
  category: doc.category as ProductCategory,
  description: makeProductDescription(doc.description),
  priceRange: doc.priceRange as PriceRange,
  variants: doc.variants.map((v) =>
    v._tag === 'CustomVariant'
      ? {
          _tag: 'CustomVariant' as const,
          size: Size.CUSTOM,
          customDimensions: {
            width: makePositiveCm(v.customDimensions!.width),
            length: makePositiveCm(v.customDimensions!.length),
          },
          price: makePrice(v.price!),
        }
      : {
          _tag: 'StandardVariant' as const,
          size: v.size as PredefinedSize,
        }
  ) as [ProductVariant, ...ProductVariant[]],
  views: {
    front: {
      viewType: doc.views.front.viewType as ViewType,
      imageUrl: makeImageUrl(doc.views.front.imageUrl),
    },
    detail: {
      viewType: doc.views.detail.viewType as ViewType,
      imageUrl: makeImageUrl(doc.views.detail.imageUrl),
    },
    additional: doc.views.additional.map((v) => ({
      viewType: v.viewType as ViewType,
      imageUrl: makeImageUrl(v.imageUrl),
    })),
  },
  status: doc.status as ProductStatus,
  syncStatus: mapSyncStatus(doc.syncStatus),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
})

// ============================================
// HELPER
// ============================================

const mapSyncStatus = (status: PilotProductDocument['syncStatus']): SyncStatus => {
  switch (status._tag) {
    case 'Synced':
      return {
        _tag: 'Synced',
        shopifyProductId: makeShopifyProductId(status.shopifyProductId!),
        syncedAt: status.syncedAt!,
      }
    case 'SyncFailed':
      return {
        _tag: 'SyncFailed',
        error: status.error!,
        failedAt: status.failedAt!,
        attempts: status.attempts!,
      }
    default:
      return { _tag: 'NotSynced' }
  }
}
