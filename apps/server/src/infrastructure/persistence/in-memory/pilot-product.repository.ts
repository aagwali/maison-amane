// src/infrastructure/persistence/in-memory/pilot-product.repository.ts

import { Layer } from "effect"
import type { PilotProduct } from "../../../domain/pilot"
import { PilotProductRepository } from "../../../ports/driven"
import { makeInMemoryRepository } from "./generic.repository"

// ============================================
// IN-MEMORY PILOT PRODUCT REPOSITORY
// ============================================

export const makeInMemoryPilotProductRepository = () =>
  makeInMemoryRepository<PilotProduct, string>((product) => product.id)

export const InMemoryPilotProductRepositoryLive = Layer.succeed(
  PilotProductRepository,
  makeInMemoryPilotProductRepository()
)
