// src/infrastructure/persistence/mongodb/mappers/catalog-product.mapper.ts

import {
  MakeProductId,
  MakeProductLabel,
  MakeProductDescription,
  MakePrice,
  MakePositiveCm,
  MakeImageUrl,
  type ProductCategory,
  type PriceRange
} from "../../../../domain/pilot"
import type { CatalogProduct, CatalogVariant } from "../../../../domain/catalog"

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
    _tag: "StandardVariant" | "CustomVariant"
    size?: "STANDARD" | "LARGE"
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
    ...(v._tag === "StandardVariant"
      ? { size: v.size }
      : {
          dimensions: {
            width: v.dimensions.width,
            length: v.dimensions.length
          },
          price: v.price
        })
  })),
  images: {
    front: product.images.front,
    detail: product.images.detail,
    gallery: [...product.images.gallery]
  },
  ...(product.shopifyUrl ? { shopifyUrl: product.shopifyUrl } : {}),
  publishedAt: product.publishedAt
})

// ============================================
// MAPPER: Document -> Domain
// ============================================

export const catalogFromDocument = (doc: CatalogProductDocument): CatalogProduct => ({
  _tag: "CatalogProduct",
  id: MakeProductId(doc._id),
  label: MakeProductLabel(doc.label),
  description: MakeProductDescription(doc.description),
  category: doc.category as ProductCategory,
  priceRange: doc.priceRange as PriceRange,
  variants: doc.variants.map(mapVariant),
  images: {
    front: MakeImageUrl(doc.images.front),
    detail: MakeImageUrl(doc.images.detail),
    gallery: doc.images.gallery.map((url) => MakeImageUrl(url))
  },
  ...(doc.shopifyUrl ? { shopifyUrl: doc.shopifyUrl } : {}),
  publishedAt: doc.publishedAt
})

// ============================================
// HELPER
// ============================================

const mapVariant = (v: CatalogProductDocument["variants"][number]): CatalogVariant => {
  if (v._tag === "CustomVariant") {
    return {
      _tag: "CustomVariant",
      dimensions: {
        width: MakePositiveCm(v.dimensions!.width),
        length: MakePositiveCm(v.dimensions!.length)
      },
      price: MakePrice(v.price!)
    }
  }
  return {
    _tag: "StandardVariant",
    size: v.size!
  }
}
