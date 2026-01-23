// src/infrastructure/persistence/in-memory/pilot-product.repository.ts

import { Layer } from 'effect'

import { PilotProductRepository } from '../../../ports/driven'
import { makeInMemoryRepository } from './generic.repository'

import type { PilotProduct } from "../../../domain/pilot"
// ============================================
// IN-MEMORY PILOT PRODUCT REPOSITORY
// ============================================

export const makeInMemoryPilotProductRepository = () =>
  makeInMemoryRepository<PilotProduct, string>((product) => product.id)

export const InMemoryPilotProductRepositoryLive = Layer.succeed(
  PilotProductRepository,
  makeInMemoryPilotProductRepository()
)
