// src/domain/pilote/ports.ts

import { Context, Effect } from "effect"
import type { ProductId, VariantId } from "./value-objects"
import type { PilotProduct } from "./aggregate"
import type { PilotProductCreated } from "./events"
import type { PersistenceError } from "./errors"
import { Option } from "effect"

// ============================================
// PRODUCT REPOSITORY
// ============================================

export interface ProductRepository {
  readonly save: (
    product: PilotProduct
  ) => Effect.Effect<PilotProduct, PersistenceError>
  
  readonly findById: (
    id: ProductId
  ) => Effect.Effect<Option.Option<PilotProduct>, PersistenceError>
  
  readonly update: (
    product: PilotProduct
  ) => Effect.Effect<PilotProduct, PersistenceError>
}

export const ProductRepository = Context.GenericTag<ProductRepository>(
  "ProductRepository"
)

// ============================================
// ID GENERATOR
// ============================================

export interface IdGenerator {
  readonly generateProductId: () => Effect.Effect<ProductId>
  readonly generateVariantId: () => Effect.Effect<VariantId>
}

export const IdGenerator = Context.GenericTag<IdGenerator>("IdGenerator")

// ============================================
// EVENT PUBLISHER
// ============================================

export interface EventPublisher {
  readonly publish: (event: PilotProductCreated) => Effect.Effect<void>
}

export const EventPublisher = Context.GenericTag<EventPublisher>("EventPublisher")

// ============================================
// CLOCK
// ============================================

export interface Clock {
  readonly now: () => Effect.Effect<Date>
}

export const Clock = Context.GenericTag<Clock>("Clock")
