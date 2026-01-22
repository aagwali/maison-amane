// src/application/catalog/queries/get-catalog-products.query.ts

import { Data, Effect, Option } from "effect"
import type { CatalogProduct } from "../../../domain/catalog"
import type { ProductId } from "../../../domain/pilot"
import { CatalogProductRepository } from "../../../ports/driven"

// ============================================
// QUERY ERROR
// ============================================

export class QueryError extends Data.TaggedError("QueryError")<{
  readonly cause: unknown
}> {}

// ============================================
// QUERIES
// ============================================

export const getCatalogProductById = (
  id: ProductId
): Effect.Effect<Option.Option<CatalogProduct>, QueryError, CatalogProductRepository> =>
  Effect.gen(function* () {
    const repo = yield* CatalogProductRepository
    return yield* repo.findById(id).pipe(
      Effect.mapError((cause) => new QueryError({ cause }))
    )
  })

export const listCatalogProducts = (): Effect.Effect<
  readonly CatalogProduct[],
  QueryError,
  CatalogProductRepository
> =>
  Effect.gen(function* () {
    const repo = yield* CatalogProductRepository
    return yield* repo.findAll().pipe(
      Effect.mapError((cause) => new QueryError({ cause }))
    )
  })
