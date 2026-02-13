// src/application/shopify/handlers/shopify-sync.handler.test.ts
//
// INTEGRATION TESTS: Tests the shopify sync handler flow.
// Uses in-memory repository and spy ShopifyClient for verification.

import { Layer } from 'effect'
import {
  type Effect,
  gen,
  fail,
  succeed,
  catchAll,
  runPromise,
  provide,
  either,
  void as effectVoid,
} from 'effect/Effect'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  makePilotProduct,
  makePilotProductPublished,
  makePilotProductUpdated,
  makeNotSynced,
  makeSynced,
  makeStandardVariant,
  PriceRange,
  ProductCategory,
  ProductStatus,
  ProductType,
  Size,
  ViewType,
  type PilotProduct,
  type ShopifyProductId,
} from '../../../domain/pilot'
import { makeCorrelationId, makeUserId } from '../../../domain/shared'
import {
  Clock,
  PilotProductRepository,
  ShopifyClient,
  ShopifyClientError,
  type ShopifyClientService,
} from '../../../ports/driven'
import { InMemoryPilotProductRepositoryLive } from '../../../infrastructure/persistence/in-memory'
import { TEST_DATE } from '../../../test-utils'

import { shopifySyncHandler, type ShopifySyncEvent } from './shopify-sync.handler'

// ============================================
// SPY SHOPIFY CLIENT
// ============================================

interface SpyShopifyClient extends ShopifyClientService {
  readonly calls: { method: string; args: unknown[] }[]
  readonly clear: () => void
  readonly setShouldFail: (fail: boolean) => void
}

const createSpyShopifyClient = (): SpyShopifyClient => {
  const calls: { method: string; args: unknown[] }[] = []
  let shouldFail = false

  return {
    calls,
    clear: () => {
      calls.length = 0
    },
    setShouldFail: (fail: boolean) => {
      shouldFail = fail
    },
    syncProduct: (product) =>
      gen(function* () {
        calls.push({ method: 'syncProduct', args: [product] })
        if (shouldFail) {
          return yield* fail(
            new ShopifyClientError({ operation: 'syncProduct', cause: 'Test error' })
          )
        }
        return 'gid://shopify/Product/123456789' as ShopifyProductId
      }),
    archiveProduct: (shopifyProductId) =>
      gen(function* () {
        calls.push({ method: 'archiveProduct', args: [shopifyProductId] })
        if (shouldFail) {
          return yield* fail(
            new ShopifyClientError({ operation: 'archiveProduct', cause: 'Test error' })
          )
        }
      }),
  }
}

// ============================================
// TEST CLOCK
// ============================================

const createTestClock = () => ({
  now: () => succeed(TEST_DATE),
})

// ============================================
// TEST FIXTURES
// ============================================

const createPilotProduct = (overrides: Partial<PilotProduct> = {}): PilotProduct =>
  makePilotProduct({
    id: 'test-product-1' as any,
    label: 'Tapis Berbère Atlas' as any,
    type: ProductType.TAPIS,
    category: ProductCategory.RUNNER,
    description: 'Beautiful handmade rug' as any,
    priceRange: PriceRange.PREMIUM,
    variants: [
      makeStandardVariant({ size: Size.REGULAR }),
      makeStandardVariant({ size: Size.LARGE }),
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
    syncStatus: makeNotSynced(),
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
    ...overrides,
  })

const buildPublishedEvent = (product: PilotProduct = createPilotProduct()): ShopifySyncEvent =>
  makePilotProductPublished({
    productId: product.id,
    product,
    correlationId: makeCorrelationId('test-correlation-id'),
    userId: makeUserId('test-user'),
    timestamp: TEST_DATE,
  })

const buildUpdatedEvent = (product: PilotProduct = createPilotProduct()): ShopifySyncEvent =>
  makePilotProductUpdated({
    productId: product.id,
    product,
    correlationId: makeCorrelationId('test-correlation-id'),
    userId: makeUserId('test-user'),
    timestamp: TEST_DATE,
  })

// ============================================
// TEST LAYER
// ============================================

interface TestContext {
  layer: Layer.Layer<PilotProductRepository | ShopifyClient | Clock>
  shopifySpy: SpyShopifyClient
  seedProduct: (product: PilotProduct) => Effect<void, never, PilotProductRepository>
}

const provideShopifySyncTestLayer = (): TestContext => {
  const shopifySpy = createSpyShopifyClient()

  const layer = Layer.mergeAll(
    InMemoryPilotProductRepositoryLive,
    Layer.succeed(ShopifyClient, shopifySpy),
    Layer.succeed(Clock, createTestClock())
  )

  const seedProduct = (product: PilotProduct) =>
    gen(function* () {
      const repo = yield* PilotProductRepository
      yield* repo.save(product)
    })
      .pipe(catchAll(() => effectVoid))

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

      await runPromise(shopifySyncHandler(event)
        .pipe(provide(testCtx.layer)))

      expect(testCtx.shopifySpy.calls).toHaveLength(0)
    })
  })

  describe('PUBLISHED status', () => {
    it('calls Shopify syncProduct for PUBLISHED products', async () => {
      const product = createPilotProduct({ status: ProductStatus.PUBLISHED })

      // Seed the product first (needed for syncStatus update)
      await runPromise(testCtx.seedProduct(product)
        .pipe(provide(testCtx.layer)))

      const event = buildPublishedEvent(product)

      await runPromise(shopifySyncHandler(event)
        .pipe(provide(testCtx.layer)))

      expect(testCtx.shopifySpy.calls).toHaveLength(1)
      const firstCall = testCtx.shopifySpy.calls[0]
      expect(firstCall).toBeDefined()
      expect(firstCall?.method).toBe('syncProduct')
    })

    it('passes product to Shopify client', async () => {
      const product = createPilotProduct({
        status: ProductStatus.PUBLISHED,
        label: 'Test Product' as any,
      })

      await runPromise(testCtx.seedProduct(product)
        .pipe(provide(testCtx.layer)))

      const event = buildPublishedEvent(product)

      await runPromise(shopifySyncHandler(event)
        .pipe(provide(testCtx.layer)))

      const call = testCtx.shopifySpy.calls[0]
      expect(call).toBeDefined()
      if (call) {
        const passedProduct = call.args[0] as PilotProduct
        expect(passedProduct.label).toBe('Test Product')
        expect(passedProduct.id).toBe(product.id)
      }
    })

    it('updates syncStatus to Synced after successful sync', async () => {
      const product = createPilotProduct({ status: ProductStatus.PUBLISHED })

      await runPromise(testCtx.seedProduct(product)
        .pipe(provide(testCtx.layer)))

      const event = buildPublishedEvent(product)

      await runPromise(shopifySyncHandler(event)
        .pipe(provide(testCtx.layer)))

      // Check the updated product
      const repo = await runPromise(
        gen(function* () {
          return yield* PilotProductRepository
        })
          .pipe(provide(testCtx.layer))
      )

      const updated = await runPromise(repo.findById(product.id))

      if (updated._tag === 'Some') {
        expect(updated.value.syncStatus._tag).toBe('Synced')
        if (updated.value.syncStatus._tag === 'Synced') {
          expect(updated.value.syncStatus.shopifyProductId).toBe('gid://shopify/Product/123456789')
        }
      }
    })

    it('handles Shopify client errors', async () => {
      const product = createPilotProduct({ status: ProductStatus.PUBLISHED })

      await runPromise(testCtx.seedProduct(product)
        .pipe(provide(testCtx.layer)))

      // Set error mode
      testCtx.shopifySpy.setShouldFail(true)

      const event = buildPublishedEvent(product)

      const result = await runPromise(
        shopifySyncHandler(event)
          .pipe(either, provide(testCtx.layer))
      )

      expect(result._tag).toBe('Left')
    })
  })

  describe('ARCHIVED status', () => {
    it('calls archiveProduct for ARCHIVED products with Synced status', async () => {
      const product = createPilotProduct({
        status: ProductStatus.ARCHIVED,
        syncStatus: makeSynced({
          shopifyProductId: 'gid://shopify/Product/existing-123' as ShopifyProductId,
          syncedAt: TEST_DATE,
        }),
      })

      await runPromise(testCtx.seedProduct(product)
        .pipe(provide(testCtx.layer)))

      const event = buildUpdatedEvent(product)

      await runPromise(shopifySyncHandler(event)
        .pipe(provide(testCtx.layer)))

      expect(testCtx.shopifySpy.calls).toHaveLength(1)
      const archiveCall = testCtx.shopifySpy.calls[0]
      expect(archiveCall).toBeDefined()
      expect(archiveCall?.method).toBe('archiveProduct')
      expect(archiveCall?.args[0]).toBe('gid://shopify/Product/existing-123')
    })

    it('skips archive for ARCHIVED products not synced to Shopify', async () => {
      const product = createPilotProduct({
        status: ProductStatus.ARCHIVED,
        syncStatus: makeNotSynced(),
      })

      const event = buildUpdatedEvent(product)

      await runPromise(shopifySyncHandler(event)
        .pipe(provide(testCtx.layer)))

      expect(testCtx.shopifySpy.calls).toHaveLength(0)
    })
  })

  describe('PilotProductUpdated event', () => {
    it('syncs updated PUBLISHED product to Shopify', async () => {
      const product = createPilotProduct({ status: ProductStatus.PUBLISHED })

      await runPromise(testCtx.seedProduct(product)
        .pipe(provide(testCtx.layer)))

      const event = buildUpdatedEvent(product)

      await runPromise(shopifySyncHandler(event)
        .pipe(provide(testCtx.layer)))

      expect(testCtx.shopifySpy.calls).toHaveLength(1)
      const updateCall = testCtx.shopifySpy.calls[0]
      expect(updateCall).toBeDefined()
      expect(updateCall?.method).toBe('syncProduct')
    })
  })
})
