// src/infrastructure/persistence/in-memory/catalog-product.repository.ts

import { Layer } from 'effect'

import { CatalogProductRepository } from '../../../ports/driven'
import { makeInMemoryRepository } from './generic.repository'

import type { CatalogProduct } from "../../../domain/catalog"
// ============================================
// IN-MEMORY CATALOG PRODUCT REPOSITORY
// ============================================

export const makeInMemoryCatalogProductRepository = () =>
  makeInMemoryRepository<CatalogProduct, string>((product) => product.id)

export const InMemoryCatalogProductRepositoryLive = Layer.succeed(
  CatalogProductRepository,
  makeInMemoryCatalogProductRepository()
)
