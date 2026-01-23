// src/application/catalog/projectors/catalog-product.projector.ts

import { Data, Effect } from 'effect'

import {
  type CatalogProduct,
  type CatalogVariant,
  MakeCatalogProduct,
} from '../../../domain/catalog'
import { CatalogProductRepository } from '../../../ports/driven'

import type { PilotProductPublished, PilotProduct } from "../../../domain/pilot"
// ============================================
// PROJECTION ERROR
// ============================================

export class ProjectionError extends Data.TaggedError("ProjectionError")<{
  readonly cause: unknown
}> {}

// ============================================
// MAPPER: PilotProduct → CatalogProduct
// ============================================

const mapToCatalogProduct = (
  product: PilotProduct,
  publishedAt: Date,
): CatalogProduct =>
  MakeCatalogProduct({
    id: product.id,
    label: product.label,
    description: product.description,
    category: product.category,
    priceRange: product.priceRange,
    variants: product.variants.map(mapVariant),
    images: {
      front: product.views.front.imageUrl,
      detail: product.views.detail.imageUrl,
      gallery: product.views.additional.map((v) => v.imageUrl),
    },
    publishedAt,
  })

const mapVariant = (variant: PilotProduct["variants"][number]): CatalogVariant => {
  if (variant._tag === "CustomVariant") {
    return {
      _tag: "CustomVariant",
      dimensions: {
        width: variant.customDimensions.width,
        length: variant.customDimensions.length,
      },
      price: variant.price,
    }
  }
  return {
    _tag: "StandardVariant",
    size: variant.size,
  }
}

// ============================================
// PROJECTOR: Handle PilotProductPublished
// ============================================

export const projectToCatalog = (
  event: PilotProductPublished,
): Effect.Effect<CatalogProduct, ProjectionError, CatalogProductRepository> =>
  Effect.gen(function* () {
    const catalogProduct = mapToCatalogProduct(event.product, event.timestamp)
    const repo = yield* CatalogProductRepository
    return yield* repo.upsert(catalogProduct).pipe(
      Effect.mapError((cause) => new ProjectionError({ cause }))
    )
  })
