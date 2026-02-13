// src/application/catalog/projectors/catalog-product.projector.ts
//
// DDD: Anti-corruption layer - maps Pilot types to Catalog types.
// The projector translates between bounded contexts.

import { Data } from 'effect'
import { gen, mapError, type Effect } from 'effect/Effect'

import {
  type CatalogProduct,
  type CatalogVariant,
  makeCatalogProduct,
  makeCatalogLabel,
  makeCatalogDescription,
  makeCatalogCategory,
  makeCatalogPriceRange,
  makeCatalogImageUrl,
  makeCatalogDimension,
  makeCatalogPrice,
} from '../../../domain/catalog'
import { CatalogProductRepository } from '../../../ports/driven'
import type {
  PilotProductPublished,
  PilotProductUpdated,
  PilotProduct,
} from '../../../domain/pilot'

// ============================================
// PROJECTION EVENT TYPE
// Both events have the same structure for projection
// ============================================

export type ProjectionEvent = PilotProductPublished | PilotProductUpdated
// ============================================
// PROJECTION ERROR
// ============================================

export class ProjectionError extends Data.TaggedError('ProjectionError')<{
  readonly cause: unknown
}> {}

// ============================================
// MAPPER: PilotProduct → CatalogProduct
// Anti-corruption layer: validates and translates Pilot types to Catalog types.
// ============================================

const mapToCatalogProduct = (product: PilotProduct, publishedAt: Date): CatalogProduct =>
  makeCatalogProduct({
    id: product.id,
    label: makeCatalogLabel(product.label),
    description: makeCatalogDescription(product.description),
    category: makeCatalogCategory(product.category),
    priceRange: makeCatalogPriceRange(product.priceRange),
    variants: product.variants.map(mapVariant),
    images: {
      front: makeCatalogImageUrl(product.views.front.imageUrl),
      detail: makeCatalogImageUrl(product.views.detail.imageUrl),
      gallery: product.views.additional.map((v) => makeCatalogImageUrl(v.imageUrl)),
    },
    publishedAt,
  })

const mapVariant = (variant: PilotProduct['variants'][number]): CatalogVariant => {
  if (variant._tag === 'CustomVariant') {
    return {
      _tag: 'CustomVariant',
      size: variant.size,
      dimensions: {
        width: makeCatalogDimension(variant.customDimensions.width),
        length: makeCatalogDimension(variant.customDimensions.length),
      },
      price: makeCatalogPrice(variant.price),
    }
  }
  return {
    _tag: 'StandardVariant',
    size: variant.size,
  }
}

// ============================================
// PROJECTOR: Handle PilotProductPublished or PilotProductUpdated
// ============================================

export const projectToCatalog = (
  event: ProjectionEvent
): Effect<CatalogProduct, ProjectionError, CatalogProductRepository> =>
  gen(function* () {
    const catalogProduct = mapToCatalogProduct(event.product, event.timestamp)
    const repo = yield* CatalogProductRepository
    return yield* repo
      .upsert(catalogProduct)
      .pipe(mapError((cause) => new ProjectionError({ cause })))
  })
