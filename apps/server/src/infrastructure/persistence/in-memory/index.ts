// src/infrastructure/persistence/in-memory/index.ts

export { createInMemoryRepository, type InMemoryRepository } from "./generic.repository"

export {
  createInMemoryPilotProductRepository,
  InMemoryPilotProductRepositoryLive
} from "./pilot-product.repository"

export {
  createInMemoryCatalogProductRepository,
  InMemoryCatalogProductRepositoryLive
} from "./catalog-product.repository"
