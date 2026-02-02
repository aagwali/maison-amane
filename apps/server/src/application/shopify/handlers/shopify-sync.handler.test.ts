// src/application/shopify/handlers/shopify-sync.handler.test.ts
//
// INTEGRATION TESTS: Tests the shopify sync handler flow.
// Uses in-memory repository and spy ShopifyClient for verification.

import { Effect, Layer } from 'effect'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  MakePilotProduct,
  MakePilotProductPublished,
  MakePilotProductUpdated,
  MakeNotSynced,
  MakeSynced,
  MakeStandardVariant,
  PriceRange,
  ProductCategory,
  ProductStatus,
  ProductType,
  Size,
  ViewType,
  type PilotProduct,
  type ShopifyProductId,
} from '../../../domain/pilot'
import { MakeCorrelationId, MakeUserId } from '../../../domain/shared'
import {
  PilotProductRepository,
  ShopifyClient,
  type ShopifyClientService,
} from '../../../ports/driven'
import { InMemoryPilotProductRepositoryLive } from '../../../infrastructure/persistence/in-memory'
import { TEST_DATE } from '../../../test-utils'
import type { ShopifyProductSetResponse } from '../dtos'

import { shopifySyncHandler, type ShopifySyncEvent } from './shopify-sync.handler'

// ============================================
// SPY SHOPIFY CLIENT
// ============================================

interface SpyShopifyClient extends ShopifyClientService {
  readonly calls: { method: string; args: unknown[] }[]
  readonly clear: () => void
  readonly setResponse: (response: ShopifyProductSetResponse) => void
}

const createSpyShopifyClient = (): SpyShopifyClient => {
  const calls: { method: string; args: unknown[] }[] = []
  let mockResponse: ShopifyProductSetResponse = {
    product: { id: 'gid://shopify/Product/123456789' },
    userErrors: [],
  }

  return {
    calls,
    clear: () => {
      calls.length = 0
    },
    setResponse: (response) => {
      mockResponse = response
    },
    productSet: (input) =>
      Effect.sync(() => {
        calls.push({ method: 'productSet', args: [input] })
        return mockResponse
      }),
    productArchive: (productId) =>
      Effect.sync(() => {
        calls.push({ method: 'productArchive', args: [productId] })
      }),
  }
}

// ============================================
// TEST FIXTURES
// ============================================

const createPilotProduct = (overrides: Partial<PilotProduct> = {}): PilotProduct =>
  MakePilotProduct({
    id: 'test-product-1' as any,
    label: 'Tapis Berbère Atlas' as any,
    type: ProductType.TAPIS,
    category: ProductCategory.RUNNER,
    description: 'Beautiful handmade rug' as any,
    priceRange: PriceRange.PREMIUM,
    variants: [
      MakeStandardVariant({ size: Size.REGULAR }),
      MakeStandardVariant({ size: Size.LARGE }),
    ],
    views: {
      front: { viewType: ViewType.FRONT, imageUrl: 'https://cdn.example.com/front.jpg' as any },
      detail: { viewType: ViewType.DETAIL, imageUrl: 'https://cdn.example.com/detail.jpg' as any },
      additional: [
        { viewType: ViewType.BACK, imageUrl: 'https://cdn.example.com/back.jpg' as any },
        { viewType: ViewType.AMBIANCE, imageUrl: 'https://cdn.example.com/ambiance.jpg' as any },
      ],
    },
    status: ProductStatus.PUBLISHED,
    syncStatus: MakeNotSynced(),
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
    ...overrides,
  })

const buildPublishedEvent = (product: PilotProduct = createPilotProduct()): ShopifySyncEvent =>
  MakePilotProductPublished({
    productId: product.id,
    product,
    correlationId: MakeCorrelationId('test-correlation-id'),
    userId: MakeUserId('test-user'),
    timestamp: TEST_DATE,
  })

const buildUpdatedEvent = (product: PilotProduct = createPilotProduct()): ShopifySyncEvent =>
  MakePilotProductUpdated({
    productId: product.id,
    product,
    correlationId: MakeCorrelationId('test-correlation-id'),
    userId: MakeUserId('test-user'),
    timestamp: TEST_DATE,
  })

// ============================================
// TEST LAYER
// ============================================

interface TestContext {
  layer: Layer.Layer<PilotProductRepository | ShopifyClient>
  shopifySpy: SpyShopifyClient
  seedProduct: (product: PilotProduct) => Effect.Effect<void, never, PilotProductRepository>
}

const provideShopifySyncTestLayer = (): TestContext => {
  const shopifySpy = createSpyShopifyClient()

  const layer = Layer.mergeAll(
    InMemoryPilotProductRepositoryLive,
    Layer.succeed(ShopifyClient, shopifySpy)
  )

  const seedProduct = (product: PilotProduct) =>
    Effect.gen(function* () {
      const repo = yield* PilotProductRepository
      yield* repo.save(product)
    }).pipe(Effect.catchAll(() => Effect.void))

  return { layer, shopifySpy, seedProduct }
}

// ============================================
// TESTS
// ============================================

describe('shopifySyncHandler', () => {
  let testCtx: TestContext

  beforeEach(() => {
    testCtx = provideShopifySyncTestLayer()
  })

  describe('DRAFT status', () => {
    it('skips sync for DRAFT products', async () => {
      const product = createPilotProduct({ status: ProductStatus.DRAFT })
      const event = buildPublishedEvent(product)

      await Effect.runPromise(shopifySyncHandler(event).pipe(Effect.provide(testCtx.layer)))

      expect(testCtx.shopifySpy.calls).toHaveLength(0)
    })
  })

  describe('PUBLISHED status', () => {
    it('calls Shopify productSet for PUBLISHED products', async () => {
      const product = createPilotProduct({ status: ProductStatus.PUBLISHED })

      // Seed the product first (needed for syncStatus update)
      await Effect.runPromise(testCtx.seedProduct(product).pipe(Effect.provide(testCtx.layer)))

      const event = buildPublishedEvent(product)

      await Effect.runPromise(shopifySyncHandler(event).pipe(Effect.provide(testCtx.layer)))

      expect(testCtx.shopifySpy.calls).toHaveLength(1)
      const firstCall = testCtx.shopifySpy.calls[0]
      expect(firstCall).toBeDefined()
      expect(firstCall?.method).toBe('productSet')
    })

    it('maps product data to Shopify format', async () => {
      const product = createPilotProduct({
        status: ProductStatus.PUBLISHED,
        label: 'Test Product' as any,
      })

      await Effect.runPromise(testCtx.seedProduct(product).pipe(Effect.provide(testCtx.layer)))

      const event = buildPublishedEvent(product)

      await Effect.runPromise(shopifySyncHandler(event).pipe(Effect.provide(testCtx.layer)))

      const call = testCtx.shopifySpy.calls[0]
      expect(call).toBeDefined()
      if (call) {
        const shopifyInput = call.args[0] as { title: string; handle: string }
        expect(shopifyInput.title).toBe('Test Product')
        expect(shopifyInput.handle).toBeDefined()
      }
    })

    it('updates syncStatus to Synced after successful sync', async () => {
      const product = createPilotProduct({ status: ProductStatus.PUBLISHED })

      await Effect.runPromise(testCtx.seedProduct(product).pipe(Effect.provide(testCtx.layer)))

      const event = buildPublishedEvent(product)

      await Effect.runPromise(shopifySyncHandler(event).pipe(Effect.provide(testCtx.layer)))

      // Check the updated product
      const repo = await Effect.runPromise(
        Effect.gen(function* () {
          return yield* PilotProductRepository
        }).pipe(Effect.provide(testCtx.layer))
      )

      const updated = await Effect.runPromise(repo.findById(product.id))

      if (updated._tag === 'Some') {
        expect(updated.value.syncStatus._tag).toBe('Synced')
        if (updated.value.syncStatus._tag === 'Synced') {
          expect(updated.value.syncStatus.shopifyProductId).toBe('gid://shopify/Product/123456789')
        }
      }
    })

    it('handles Shopify user errors', async () => {
      const product = createPilotProduct({ status: ProductStatus.PUBLISHED })

      await Effect.runPromise(testCtx.seedProduct(product).pipe(Effect.provide(testCtx.layer)))

      // Set error response
      testCtx.shopifySpy.setResponse({
        product: null,
        userErrors: [{ field: ['title'], message: 'Title is required' }],
      })

      const event = buildPublishedEvent(product)

      const result = await Effect.runPromise(
        shopifySyncHandler(event).pipe(Effect.either, Effect.provide(testCtx.layer))
      )

      expect(result._tag).toBe('Left')
    })
  })

  describe('ARCHIVED status', () => {
    it('calls productArchive for ARCHIVED products with Synced status', async () => {
      const product = createPilotProduct({
        status: ProductStatus.ARCHIVED,
        syncStatus: MakeSynced({
          shopifyProductId: 'gid://shopify/Product/existing-123' as ShopifyProductId,
          syncedAt: TEST_DATE,
        }),
      })

      await Effect.runPromise(testCtx.seedProduct(product).pipe(Effect.provide(testCtx.layer)))

      const event = buildUpdatedEvent(product)

      await Effect.runPromise(shopifySyncHandler(event).pipe(Effect.provide(testCtx.layer)))

      expect(testCtx.shopifySpy.calls).toHaveLength(1)
      const archiveCall = testCtx.shopifySpy.calls[0]
      expect(archiveCall).toBeDefined()
      expect(archiveCall?.method).toBe('productArchive')
      expect(archiveCall?.args[0]).toBe('gid://shopify/Product/existing-123')
    })

    it('skips archive for ARCHIVED products not synced to Shopify', async () => {
      const product = createPilotProduct({
        status: ProductStatus.ARCHIVED,
        syncStatus: MakeNotSynced(),
      })

      const event = buildUpdatedEvent(product)

      await Effect.runPromise(shopifySyncHandler(event).pipe(Effect.provide(testCtx.layer)))

      expect(testCtx.shopifySpy.calls).toHaveLength(0)
    })
  })

  describe('PilotProductUpdated event', () => {
    it('syncs updated PUBLISHED product to Shopify', async () => {
      const product = createPilotProduct({ status: ProductStatus.PUBLISHED })

      await Effect.runPromise(testCtx.seedProduct(product).pipe(Effect.provide(testCtx.layer)))

      const event = buildUpdatedEvent(product)

      await Effect.runPromise(shopifySyncHandler(event).pipe(Effect.provide(testCtx.layer)))

      expect(testCtx.shopifySpy.calls).toHaveLength(1)
      const updateCall = testCtx.shopifySpy.calls[0]
      expect(updateCall).toBeDefined()
      expect(updateCall?.method).toBe('productSet')
    })
  })
})
