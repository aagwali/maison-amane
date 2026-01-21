// src/application/catalog/projectors/catalog-product.projector.ts

import * as S from "effect/Schema"
import { case as constructor } from "effect/Data"
import { Effect, pipe } from "effect"
import type { PilotProductPublished, PilotProduct } from "../../../domain/pilot"
import {
  MakeCatalogProduct,
  type CatalogProduct,
  type CatalogVariant,
} from "../../../domain/catalog"
import { CatalogProductRepository } from "../../../ports/driven"
import { TaggedSchema } from "../../../domain/shared"

// ============================================
// PROJECTION ERROR
// ============================================

const ProjectionErrorSchema = TaggedSchema("ProjectionError", {
  cause: S.Unknown,
})

export type ProjectionError = typeof ProjectionErrorSchema.Type

export const MakeProjectionError = constructor<ProjectionError>()

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
  pipe(
    Effect.succeed(mapToCatalogProduct(event.product, event.timestamp)),
    Effect.flatMap((catalogProduct) =>
      pipe(
        CatalogProductRepository,
        Effect.flatMap((repo) => repo.upsert(catalogProduct)),
        Effect.mapError((e) => MakeProjectionError({ cause: e })),
      )
    ),
  )
