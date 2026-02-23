// src/infrastructure/persistence/in-memory/pilot-product.repository.ts

import { Layer } from 'effect'

import { PilotProductRepository, type PilotProductRepositoryService } from '../../../ports/driven'
import { ProductNotFoundError, type PilotProduct } from '../../../domain/pilot'

import { createInMemoryRepository } from './generic.repository'

// ============================================
// IN-MEMORY PILOT PRODUCT REPOSITORY
// ============================================

export const createInMemoryPilotProductRepository = (): PilotProductRepositoryService => {
  const baseRepo = createInMemoryRepository<PilotProduct, string>((product) => product.id)

  return {
    save: baseRepo.save,
    findById: baseRepo.findById,
    getById: (id) => baseRepo.getById(id, (productId) => new ProductNotFoundError({ productId })),
    update: baseRepo.update,
    findAll: baseRepo.findAll,
  }
}

export const InMemoryPilotProductRepositoryLive = Layer.succeed(
  PilotProductRepository,
  createInMemoryPilotProductRepository()
)
