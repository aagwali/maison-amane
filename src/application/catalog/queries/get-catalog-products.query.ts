// src/application/catalog/queries/get-catalog-products.query.ts

import { Effect, pipe } from "effect"
import type { CatalogProduct } from "../../../domain/catalog"
import type { ProductId } from "../../../domain/pilot"
import { CatalogProductRepository } from "../../../ports/driven"
import { Option } from "effect"

// ============================================
// QUERY ERROR
// ============================================

export interface QueryError {
  readonly _tag: "QueryError"
  readonly cause: unknown
}

export const QueryError = {
  create: (cause: unknown): QueryError => ({
    _tag: "QueryError",
    cause
  })
}

// ============================================
// QUERIES
// ============================================

export const getCatalogProductById = (
  id: ProductId
): Effect.Effect<Option.Option<CatalogProduct>, QueryError, CatalogProductRepository> =>
  pipe(
    CatalogProductRepository,
    Effect.flatMap((repo) => repo.findById(id)),
    Effect.mapError(QueryError.create)
  )

export const listCatalogProducts = (): Effect.Effect<
  readonly CatalogProduct[],
  QueryError,
  CatalogProductRepository
> =>
  pipe(
    CatalogProductRepository,
    Effect.flatMap((repo) => repo.findAll()),
    Effect.mapError(QueryError.create)
  )
