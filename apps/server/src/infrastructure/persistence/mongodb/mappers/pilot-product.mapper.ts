// src/infrastructure/persistence/mongodb/mappers/pilot-product.mapper.ts

import {
  makeImageUrl,
  makePositiveCm,
  makePrice,
  makeProductDescription,
  makeProductId,
  makeProductLabel,
  makeShopifyProductId,
  type Material,
  type PilotProduct,
  type PredefinedSize,
  ProductShape,
  ProductStatus,
  ProductType,
  type ProductVariant,
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
  shape: string
  description: string
  material: string
  variants: Array<{
    sizeSpec:
      | { _tag: 'CatalogSize'; size: string }
      | { _tag: 'BespokeSize'; width: number; length: number }
    pricingSpec: { _tag: 'FormulaPrice' } | { _tag: 'NegotiatedPrice'; amount: number }
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

export type PilotProductDocument = PilotProductDocumentSchema

// ============================================
// MAPPER: Domain -> Document
// ============================================

export const pilotToDocument = (product: PilotProduct): PilotProductDocument => ({
  _id: product.id,
  label: product.label,
  type: product.type,
  shape: product.shape,
  description: product.description,
  material: product.material,
  variants: product.variants.map((v) => ({
    sizeSpec: v.sizeSpec,
    pricingSpec: v.pricingSpec,
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
  shape: (doc.shape ?? ProductShape.STANDARD) as PilotProduct['shape'],
  description: makeProductDescription(doc.description),
  material: (doc.material ?? 'MTIRT') as Material,
  variants: doc.variants.map(mapVariant) as [ProductVariant, ...ProductVariant[]],
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
// HELPERS
// ============================================

const mapVariant = (v: PilotProductDocument['variants'][number]): ProductVariant => {
  const sizeSpec =
    v.sizeSpec._tag === 'BespokeSize'
      ? {
          _tag: 'BespokeSize' as const,
          width: makePositiveCm(v.sizeSpec.width),
          length: makePositiveCm(v.sizeSpec.length),
        }
      : {
          _tag: 'CatalogSize' as const,
          size: v.sizeSpec.size as PredefinedSize,
        }

  const pricingSpec =
    v.pricingSpec._tag === 'NegotiatedPrice'
      ? { _tag: 'NegotiatedPrice' as const, amount: makePrice(v.pricingSpec.amount) }
      : { _tag: 'FormulaPrice' as const }

  return { sizeSpec, pricingSpec }
}

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
