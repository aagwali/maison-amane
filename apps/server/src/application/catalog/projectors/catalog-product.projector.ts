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
  makeCatalogShape,
  makeCatalogMaterial,
  makeCatalogImageUrl,
  makeCatalogDimension,
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
    shape: makeCatalogShape(product.shape),
    material: makeCatalogMaterial(product.material),
    variants: product.variants.map(mapVariant),
    images: {
      front: makeCatalogImageUrl(product.views.front.imageUrl),
      detail: makeCatalogImageUrl(product.views.detail.imageUrl),
      gallery: product.views.additional.map((v) => makeCatalogImageUrl(v.imageUrl)),
    },
    publishedAt,
  })

const mapVariant = (variant: PilotProduct['variants'][number]): CatalogVariant => {
  const sizeSpec = variant.sizeSpec
  const pricingSpec = variant.pricingSpec

  const catalogSizeSpec =
    sizeSpec._tag === 'BespokeSize'
      ? {
          _tag: 'BespokeSize' as const,
          width: makeCatalogDimension(sizeSpec.width),
          length: makeCatalogDimension(sizeSpec.length),
        }
      : { _tag: 'CatalogSize' as const, size: sizeSpec.size }

  const catalogPricingSpec =
    pricingSpec._tag === 'NegotiatedPrice'
      ? { _tag: 'NegotiatedPrice' as const, amount: pricingSpec.amount }
      : { _tag: 'FormulaPrice' as const }

  return { sizeSpec: catalogSizeSpec, pricingSpec: catalogPricingSpec }
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
