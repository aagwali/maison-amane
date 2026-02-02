// src/infrastructure/persistence/mongodb/repository-layer-factory.ts

import { Context, Effect, Layer } from 'effect'
import type { Db } from 'mongodb'

import { MongoDatabase } from './mongo-database'

// ============================================
// GENERIC REPOSITORY LAYER FACTORY
// ============================================

/**
 * Creates a Layer for a MongoDB repository following the standard pattern.
 *
 * This factory eliminates boilerplate by providing a reusable way to create
 * repository layers that depend on MongoDatabase.
 *
 * @template TService - The repository service interface type
 * @template TTag - The Context.Tag type
 * @param tag - The Context.Tag for the repository (e.g., PilotProductRepository)
 * @param createRepository - Factory function that creates the repository from a Db instance
 * @returns Effect Layer that provides the repository service
 *
 * @example
 * ```typescript
 * export const MongodbPilotProductRepositoryLive = createRepositoryLayer(
 *   PilotProductRepository,
 *   createMongodbPilotProductRepository
 * )
 * ```
 */
export const createRepositoryLayer = <
  TService,
  TTag extends Context.Tag<Context.Tag.Identifier<TTag>, TService>,
>(
  tag: TTag,
  createRepository: (db: Db) => TService
): Layer.Layer<Context.Tag.Identifier<TTag>, never, MongoDatabase> =>
  Layer.effect(tag, Effect.map(MongoDatabase, createRepository))
