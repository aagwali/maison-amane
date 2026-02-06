// src/infrastructure/persistence/mongodb/mappers/catalog-product.mapper.ts
//
// DDD: Infrastructure mapper for Catalog bounded context.
// Uses Catalog-specific types, imports ProductId from shared-kernel.

import { makeProductId } from '@maison-amane/shared-kernel'

import type { CatalogProduct, CatalogVariant } from '../../../../domain/catalog'
import {
  makeCatalogLabel,
  makeCatalogDescription,
  makeCatalogImageUrl,
  makeCatalogDimension,
  makeCatalogPrice,
  makeCatalogCategory,
  makeCatalogPriceRange,
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
  id: makeProductId(doc._id),
  label: makeCatalogLabel(doc.label),
  description: makeCatalogDescription(doc.description),
  category: makeCatalogCategory(doc.category),
  priceRange: makeCatalogPriceRange(doc.priceRange),
  variants: doc.variants.map(mapVariant),
  images: {
    front: makeCatalogImageUrl(doc.images.front),
    detail: makeCatalogImageUrl(doc.images.detail),
    gallery: doc.images.gallery.map((url) => makeCatalogImageUrl(url)),
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
        width: makeCatalogDimension(v.dimensions!.width),
        length: makeCatalogDimension(v.dimensions!.length),
      },
      price: makeCatalogPrice(v.price!),
    }
  }
  return {
    _tag: 'StandardVariant',
    size: v.size as 'REGULAR' | 'LARGE',
  }
}
