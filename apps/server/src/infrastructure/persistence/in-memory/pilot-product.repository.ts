// src/infrastructure/persistence/in-memory/pilot-product.repository.ts

import { Layer } from 'effect'

import { PilotProductRepository } from '../../../ports/driven'
import type { PilotProduct } from '../../../domain/pilot'

import { createInMemoryRepository } from './generic.repository'

// ============================================
// IN-MEMORY PILOT PRODUCT REPOSITORY
// ============================================

export const createInMemoryPilotProductRepository = () =>
  createInMemoryRepository<PilotProduct, string>((product) => product.id)

export const InMemoryPilotProductRepositoryLive = Layer.succeed(
  PilotProductRepository,
  createInMemoryPilotProductRepository()
)
