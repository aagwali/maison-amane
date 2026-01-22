// src/infrastructure/persistence/in-memory/index.ts

export { makeInMemoryRepository, type InMemoryRepository } from "./generic.repository"

export {
  makeInMemoryPilotProductRepository,
  InMemoryPilotProductRepositoryLive
} from "./pilot-product.repository"

export {
  makeInMemoryCatalogProductRepository,
  InMemoryCatalogProductRepositoryLive
} from "./catalog-product.repository"
