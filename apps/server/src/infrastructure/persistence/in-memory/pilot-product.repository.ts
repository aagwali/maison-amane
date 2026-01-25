// src/infrastructure/persistence/in-memory/pilot-product.repository.ts

import { Layer } from 'effect'

import { PilotProductRepository } from '../../../ports/driven'
import { createInMemoryRepository } from './generic.repository'

import type { PilotProduct } from "../../../domain/pilot"
// ============================================
// IN-MEMORY PILOT PRODUCT REPOSITORY
// ============================================

export const createInMemoryPilotProductRepository = () =>
  createInMemoryRepository<PilotProduct, string>((product) => product.id)

export const InMemoryPilotProductRepositoryLive = Layer.succeed(
  PilotProductRepository,
  createInMemoryPilotProductRepository()
)
