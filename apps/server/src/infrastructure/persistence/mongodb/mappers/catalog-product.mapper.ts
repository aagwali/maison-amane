// src/infrastructure/persistence/mongodb/mappers/catalog-product.mapper.ts
//
// DDD: Infrastructure mapper for Catalog bounded context.
// Uses Catalog-specific types, imports ProductId from shared-kernel.

import { MakeProductId } from '@maison-amane/shared-kernel'

import type { CatalogProduct, CatalogVariant } from '../../../../domain/catalog'
import {
  MakeCatalogLabel,
  MakeCatalogDescription,
  MakeCatalogImageUrl,
  MakeCatalogDimension,
  MakeCatalogPrice,
  MakeCatalogCategory,
  MakeCatalogPriceRange,
} from '../../../../domain/catalog'

// ============================================
// MONGODB DOCUMENT TYPE
// ============================================

export interface CatalogProductDocument {
  _id: string
  label: string
  description: string
  category: string
  priceRange: string
  variants: Array<{
    _tag: 'StandardVariant' | 'CustomVariant'
    size: 'REGULAR' | 'LARGE' | 'CUSTOM'
    dimensions?: { width: number; length: number }
    price?: number
  }>
  images: {
    front: string
    detail: string
    gallery: string[]
  }
  shopifyUrl?: string
  publishedAt: Date
}

// ============================================
// MAPPER: Domain -> Document
// ============================================

export const catalogToDocument = (product: CatalogProduct): CatalogProductDocument => ({
  _id: product.id,
  label: product.label,
  description: product.description,
  category: product.category,
  priceRange: product.priceRange,
  variants: product.variants.map((v) => ({
    _tag: v._tag,
    size: v.size,
    ...(v._tag === 'CustomVariant'
      ? {
          dimensions: {
            width: v.dimensions.width,
            length: v.dimensions.length,
          },
          price: v.price,
        }
      : {}),
  })),
  images: {
    front: product.images.front,
    detail: product.images.detail,
    gallery: [...product.images.gallery],
  },
  ...(product.shopifyUrl ? { shopifyUrl: product.shopifyUrl } : {}),
  publishedAt: product.publishedAt,
})

// ============================================
// MAPPER: Document -> Domain
// ============================================

export const catalogFromDocument = (doc: CatalogProductDocument): CatalogProduct => ({
  _tag: 'CatalogProduct',
  id: MakeProductId(doc._id),
  label: MakeCatalogLabel(doc.label),
  description: MakeCatalogDescription(doc.description),
  category: MakeCatalogCategory(doc.category),
  priceRange: MakeCatalogPriceRange(doc.priceRange),
  variants: doc.variants.map(mapVariant),
  images: {
    front: MakeCatalogImageUrl(doc.images.front),
    detail: MakeCatalogImageUrl(doc.images.detail),
    gallery: doc.images.gallery.map((url) => MakeCatalogImageUrl(url)),
  },
  ...(doc.shopifyUrl ? { shopifyUrl: doc.shopifyUrl } : {}),
  publishedAt: doc.publishedAt,
})

// ============================================
// HELPER
// ============================================

const mapVariant = (v: CatalogProductDocument['variants'][number]): CatalogVariant => {
  if (v._tag === 'CustomVariant') {
    return {
      _tag: 'CustomVariant',
      size: v.size as 'CUSTOM',
      dimensions: {
        width: MakeCatalogDimension(v.dimensions!.width),
        length: MakeCatalogDimension(v.dimensions!.length),
      },
      price: MakeCatalogPrice(v.price!),
    }
  }
  return {
    _tag: 'StandardVariant',
    size: v.size as 'REGULAR' | 'LARGE',
  }
}
