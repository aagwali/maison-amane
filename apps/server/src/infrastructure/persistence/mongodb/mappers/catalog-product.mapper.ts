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
  makeCatalogShape,
  makeCatalogMaterial,
} from '../../../../domain/catalog'

// ============================================
// MONGODB DOCUMENT TYPE
// ============================================

export interface CatalogProductDocument {
  _id: string
  label: string
  description: string
  shape: string
  material: string
  variants: Array<{
    sizeSpec:
      | { _tag: 'CatalogSize'; size: string }
      | { _tag: 'BespokeSize'; width: number; length: number }
    pricingSpec: { _tag: 'FormulaPrice' } | { _tag: 'NegotiatedPrice'; amount: number }
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
  shape: product.shape,
  material: product.material,
  variants: product.variants.map((v) => ({
    sizeSpec: v.sizeSpec,
    pricingSpec: v.pricingSpec,
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
  shape: makeCatalogShape(doc.shape),
  material: makeCatalogMaterial(doc.material),
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
  const sizeSpec =
    v.sizeSpec._tag === 'BespokeSize'
      ? {
          _tag: 'BespokeSize' as const,
          width: makeCatalogDimension(v.sizeSpec.width),
          length: makeCatalogDimension(v.sizeSpec.length),
        }
      : { _tag: 'CatalogSize' as const, size: v.sizeSpec.size as 'MEDIUM' | 'LARGE' }

  const pricingSpec =
    v.pricingSpec._tag === 'NegotiatedPrice'
      ? { _tag: 'NegotiatedPrice' as const, amount: v.pricingSpec.amount }
      : { _tag: 'FormulaPrice' as const }

  return { sizeSpec, pricingSpec }
}
