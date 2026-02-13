// src/infrastructure/persistence/in-memory/catalog-product.repository.ts

import { Layer } from 'effect'

import { CatalogProductRepository } from '../../../ports/driven'
import type { CatalogProduct } from '../../../domain/catalog'

import { createInMemoryRepository } from './generic.repository'

// ============================================
// IN-MEMORY CATALOG PRODUCT REPOSITORY
// ============================================

export const createInMemoryCatalogProductRepository = () =>
  createInMemoryRepository<CatalogProduct, string>((product) => product.id)

export const InMemoryCatalogProductRepositoryLive = Layer.succeed(
  CatalogProductRepository,
  createInMemoryCatalogProductRepository()
)
