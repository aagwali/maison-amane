// src/application/catalog/projectors/catalog-product.projector.ts
//
// DDD: Anti-corruption layer - maps Pilot types to Catalog types.
// The projector translates between bounded contexts.

import { Data, Effect } from 'effect'

import {
  type CatalogProduct,
  type CatalogVariant,
  MakeCatalogProduct,
  MakeCatalogLabel,
  MakeCatalogDescription,
  MakeCatalogCategory,
  MakeCatalogPriceRange,
  MakeCatalogImageUrl,
  MakeCatalogDimension,
  MakeCatalogPrice,
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
  MakeCatalogProduct({
    id: product.id,
    label: MakeCatalogLabel(product.label),
    description: MakeCatalogDescription(product.description),
    category: MakeCatalogCategory(product.category),
    priceRange: MakeCatalogPriceRange(product.priceRange),
    variants: product.variants.map(mapVariant),
    images: {
      front: MakeCatalogImageUrl(product.views.front.imageUrl),
      detail: MakeCatalogImageUrl(product.views.detail.imageUrl),
      gallery: product.views.additional.map((v) => MakeCatalogImageUrl(v.imageUrl)),
    },
    publishedAt,
  })

const mapVariant = (variant: PilotProduct['variants'][number]): CatalogVariant => {
  if (variant._tag === 'CustomVariant') {
    return {
      _tag: 'CustomVariant',
      size: variant.size,
      dimensions: {
        width: MakeCatalogDimension(variant.customDimensions.width),
        length: MakeCatalogDimension(variant.customDimensions.length),
      },
      price: MakeCatalogPrice(variant.price),
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
): Effect.Effect<CatalogProduct, ProjectionError, CatalogProductRepository> =>
  Effect.gen(function* () {
    const catalogProduct = mapToCatalogProduct(event.product, event.timestamp)
    const repo = yield* CatalogProductRepository
    return yield* repo
      .upsert(catalogProduct)
      .pipe(Effect.mapError((cause) => new ProjectionError({ cause })))
  })
