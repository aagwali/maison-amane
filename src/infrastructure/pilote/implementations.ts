// src/infrastructure/pilote/implementations.ts

import { Effect, Layer, Option, pipe } from "effect"
import { v4 as uuidv4 } from "uuid"
import {
  ProductRepository,
  IdGenerator,
  EventPublisher,
  Clock,
  MakeProductId,
  MakeVariantId,
  MakeProductLabel,
  MakeProductDescription,
  MakePrice,
  MakePositiveCm,
  MakeImageUrl,
  MakeShopifyProductId,
  PersistenceError,
  ProductType,
  ProductCategory,
  PriceRange,
  ProductStatus,
  Size,
  ViewType,
  type PredefinedSize,
  type ProductVariant,
  type SyncStatus
} from "../../domain/pilote"
import type { PilotProduct } from "../../domain/pilote"
import type { PilotProductCreated } from "../../domain/pilote"

// ============================================
// UUID ID GENERATOR
// ============================================

export const UuidIdGeneratorLive = Layer.succeed(
  IdGenerator,
  {
    generateProductId: () => Effect.succeed(MakeProductId(uuidv4())),
    generateVariantId: () => Effect.succeed(MakeVariantId(uuidv4()))
  }
)

// ============================================
// SYSTEM CLOCK
// ============================================

export const SystemClockLive = Layer.succeed(
  Clock,
  {
    now: () => Effect.succeed(new Date())
  }
)

// ============================================
// CONSOLE EVENT PUBLISHER (for development)
// ============================================

export const ConsoleEventPublisherLive = Layer.succeed(
  EventPublisher,
  {
    publish: (event: PilotProductCreated) =>
      Effect.sync(() => {
        console.log("[Event Published]", event._tag, event.productId)
      })
  }
)

// ============================================
// IN-MEMORY REPOSITORY (for development/tests)
// ============================================

export const makeInMemoryProductRepository = (): ProductRepository => {
  const store = new Map<string, PilotProduct>()
  
  return {
    save: (product) =>
      Effect.sync(() => {
        store.set(product.id, product)
        return product
      }),
    
    findById: (id) =>
      Effect.sync(() => {
        const product = store.get(id)
        return product ? Option.some(product) : Option.none()
      }),
    
    update: (product) =>
      Effect.sync(() => {
        store.set(product.id, product)
        return product
      })
  }
}

export const InMemoryProductRepositoryLive = Layer.succeed(
  ProductRepository,
  makeInMemoryProductRepository()
)

// ============================================
// MONGODB PRODUCT REPOSITORY
// ============================================

// Types for MongoDB document
interface PilotProductDocument {
  _id: string
  label: string
  type: string
  category: string
  description: string
  priceRange: string
  variants: Array<{
    _tag: "StandardVariant" | "CustomVariant"
    id: string
    size: string
    customDimensions?: { width: number; length: number }
    price?: number
  }>
  views: {
    front: { viewType: string; imageUrl: string }
    detail: { viewType: string; imageUrl: string }
    additional: Array<{ viewType: string; imageUrl: string }>
  }
  status: string
  syncStatus: {
    _tag: "NotSynced" | "Synced" | "SyncFailed"
    shopifyProductId?: string
    syncedAt?: Date
    error?: { code: string; message: string; details: unknown }
    failedAt?: Date
    attempts?: number
  }
  createdAt: Date
  updatedAt: Date
}

// Mapper: Domain -> Document
const toDocument = (product: PilotProduct): PilotProductDocument => ({
  _id: product.id,
  label: product.label,
  type: product.type,
  category: product.category,
  description: product.description,
  priceRange: product.priceRange,
  variants: product.variants.map((v) => ({
    _tag: v._tag,
    id: v.id,
    size: v.size,
    ...(v._tag === "CustomVariant"
      ? {
          customDimensions: {
            width: v.customDimensions.width,
            length: v.customDimensions.length
          },
          price: v.price
        }
      : {})
  })),
  views: {
    front: {
      viewType: product.views.front.viewType,
      imageUrl: product.views.front.imageUrl
    },
    detail: {
      viewType: product.views.detail.viewType,
      imageUrl: product.views.detail.imageUrl
    },
    additional: product.views.additional.map((v) => ({
      viewType: v.viewType,
      imageUrl: v.imageUrl
    }))
  },
  status: product.status,
  syncStatus: {
    _tag: product.syncStatus._tag,
    ...(product.syncStatus._tag === "Synced"
      ? {
          shopifyProductId: product.syncStatus.shopifyProductId,
          syncedAt: product.syncStatus.syncedAt
        }
      : {}),
    ...(product.syncStatus._tag === "SyncFailed"
      ? {
          error: product.syncStatus.error,
          failedAt: product.syncStatus.failedAt,
          attempts: product.syncStatus.attempts
        }
      : {})
  },
  createdAt: product.createdAt,
  updatedAt: product.updatedAt
})

// Mapper: Document -> Domain
const fromDocument = (doc: PilotProductDocument): PilotProduct => ({
  _tag: "PilotProduct",
  id: MakeProductId(doc._id),
  label: MakeProductLabel(doc.label),
  type: doc.type as ProductType,
  category: doc.category as ProductCategory,
  description: MakeProductDescription(doc.description),
  priceRange: doc.priceRange as PriceRange,
  variants: doc.variants.map((v) =>
    v._tag === "CustomVariant"
      ? {
          _tag: "CustomVariant" as const,
          id: MakeVariantId(v.id),
          size: Size.CUSTOM,
          customDimensions: {
            width: MakePositiveCm(v.customDimensions!.width),
            length: MakePositiveCm(v.customDimensions!.length)
          },
          price: MakePrice(v.price!)
        }
      : {
          _tag: "StandardVariant" as const,
          id: MakeVariantId(v.id),
          size: v.size as PredefinedSize
        }
  ) as [ProductVariant, ...ProductVariant[]],
  views: {
    front: {
      viewType: doc.views.front.viewType as ViewType,
      imageUrl: MakeImageUrl(doc.views.front.imageUrl)
    },
    detail: {
      viewType: doc.views.detail.viewType as ViewType,
      imageUrl: MakeImageUrl(doc.views.detail.imageUrl)
    },
    additional: doc.views.additional.map((v) => ({
      viewType: v.viewType as ViewType,
      imageUrl: MakeImageUrl(v.imageUrl)
    }))
  },
  status: doc.status as ProductStatus,
  syncStatus: mapSyncStatus(doc.syncStatus),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
})

// Helper pour mapper le syncStatus
const mapSyncStatus = (status: PilotProductDocument["syncStatus"]): SyncStatus => {
  switch (status._tag) {
    case "Synced":
      return {
        _tag: "Synced",
        shopifyProductId: MakeShopifyProductId(status.shopifyProductId!),
        syncedAt: status.syncedAt!
      }
    case "SyncFailed":
      return {
        _tag: "SyncFailed",
        error: status.error!,
        failedAt: status.failedAt!,
        attempts: status.attempts!
      }
    default:
      return { _tag: "NotSynced" }
  }
}

// Factory for MongoDB repository (requires db instance)
export const makeMongoProductRepository = (
  db: any // MongoDB Db instance
): ProductRepository => {
  const collection = db.collection("pilot_products")
  
  return {
    save: (product) =>
      pipe(
        Effect.tryPromise({
          try: async () => {
            const doc = toDocument(product)
            await collection.insertOne(doc)
            return product
          },
          catch: (error) => PersistenceError.create(error)
        })
      ),
    
    findById: (id) =>
      pipe(
        Effect.tryPromise({
          try: async () => {
            const doc = await collection.findOne({ _id: id })
            return doc ? Option.some(fromDocument(doc)) : Option.none()
          },
          catch: (error) => PersistenceError.create(error)
        })
      ),
    
    update: (product) =>
      pipe(
        Effect.tryPromise({
          try: async () => {
            const doc = toDocument(product)
            await collection.replaceOne({ _id: product.id }, doc)
            return product
          },
          catch: (error) => PersistenceError.create(error)
        })
      )
  }
}

// Layer factory (requires db instance at runtime)
export const makeMongoProductRepositoryLayer = (db: any) =>
  Layer.succeed(ProductRepository, makeMongoProductRepository(db))
