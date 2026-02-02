// src/application/catalog/handlers/catalog-projection.handler.test.ts
//
// INTEGRATION TESTS: Tests the catalog projection handler flow.
// Uses real in-memory catalog repository and spy for verification.

import { Effect, Layer } from 'effect'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  MakePilotProduct,
  MakePilotProductPublished,
  MakePilotProductUpdated,
  MakeNotSynced,
  MakeStandardVariant,
  MakeCustomVariant,
  MakePrice,
  MakePositiveCm,
  PriceRange,
  ProductCategory,
  ProductStatus,
  ProductType,
  Size,
  ViewType,
  type PilotProduct,
} from '../../../domain/pilot'
import { MakeCorrelationId, MakeUserId } from '../../../domain/shared'
import { CatalogProductRepository } from '../../../ports/driven'
import { InMemoryCatalogProductRepositoryLive } from '../../../infrastructure/persistence/in-memory'
import { TEST_DATE } from '../../../test-utils'
import type { ProjectionEvent } from '../projectors/catalog-product.projector'

import { catalogProjectionHandler } from './catalog-projection.handler'

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

const buildPublishedEvent = (product: PilotProduct = createPilotProduct()): ProjectionEvent =>
  MakePilotProductPublished({
    productId: product.id,
    product,
    correlationId: MakeCorrelationId('test-correlation-id'),
    userId: MakeUserId('test-user'),
    timestamp: TEST_DATE,
  })

const buildUpdatedEvent = (product: PilotProduct = createPilotProduct()): ProjectionEvent =>
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

const provideCatalogTestLayer = () => InMemoryCatalogProductRepositoryLive

// ============================================
// TESTS
// ============================================

describe('catalogProjectionHandler', () => {
  let testLayer: Layer.Layer<CatalogProductRepository>

  beforeEach(() => {
    testLayer = provideCatalogTestLayer()
  })

  describe('PilotProductPublished event', () => {
    it('projects pilot product to catalog product', async () => {
      const product = createPilotProduct()
      const event = buildPublishedEvent(product)

      await Effect.runPromise(catalogProjectionHandler(event).pipe(Effect.provide(testLayer)))

      // Verify product was saved
      const repo = await Effect.runPromise(
        Effect.gen(function* () {
          return yield* CatalogProductRepository
        }).pipe(Effect.provide(testLayer))
      )

      const saved = await Effect.runPromise(repo.findById(product.id))

      expect(saved._tag).toBe('Some')
      if (saved._tag === 'Some') {
        expect(saved.value.id).toBe(product.id)
        expect(saved.value.label).toBe(product.label)
        expect(saved.value.category).toBe(product.category)
      }
    })

    it('maps views to images correctly', async () => {
      const product = createPilotProduct()
      const event = buildPublishedEvent(product)

      await Effect.runPromise(catalogProjectionHandler(event).pipe(Effect.provide(testLayer)))

      const repo = await Effect.runPromise(
        Effect.gen(function* () {
          return yield* CatalogProductRepository
        }).pipe(Effect.provide(testLayer))
      )

      const saved = await Effect.runPromise(repo.findById(product.id))

      if (saved._tag === 'Some') {
        expect(saved.value.images.front).toBe('https://cdn.example.com/front.jpg')
        expect(saved.value.images.detail).toBe('https://cdn.example.com/detail.jpg')
        expect(saved.value.images.gallery).toHaveLength(2)
      }
    })

    it('maps standard variants correctly', async () => {
      const product = createPilotProduct()
      const event = buildPublishedEvent(product)

      await Effect.runPromise(catalogProjectionHandler(event).pipe(Effect.provide(testLayer)))

      const repo = await Effect.runPromise(
        Effect.gen(function* () {
          return yield* CatalogProductRepository
        }).pipe(Effect.provide(testLayer))
      )

      const saved = await Effect.runPromise(repo.findById(product.id))

      if (saved._tag === 'Some') {
        expect(saved.value.variants).toHaveLength(2)
        const firstVariant = saved.value.variants[0]
        expect(firstVariant).toBeDefined()
        expect(firstVariant?._tag).toBe('StandardVariant')
        if (firstVariant && firstVariant._tag === 'StandardVariant') {
          expect(firstVariant.size).toBe(Size.REGULAR)
        }
      }
    })

    it('maps custom variants with dimensions', async () => {
      const product = createPilotProduct({
        variants: [
          MakeCustomVariant({
            size: Size.CUSTOM,
            customDimensions: {
              width: MakePositiveCm(150),
              length: MakePositiveCm(300),
            },
            price: MakePrice(25000),
          }),
        ],
      })
      const event = buildPublishedEvent(product)

      await Effect.runPromise(catalogProjectionHandler(event).pipe(Effect.provide(testLayer)))

      const repo = await Effect.runPromise(
        Effect.gen(function* () {
          return yield* CatalogProductRepository
        }).pipe(Effect.provide(testLayer))
      )

      const saved = await Effect.runPromise(repo.findById(product.id))

      if (saved._tag === 'Some') {
        const firstVariant = saved.value.variants[0]
        expect(firstVariant).toBeDefined()
        expect(firstVariant?._tag).toBe('CustomVariant')
        if (firstVariant && firstVariant._tag === 'CustomVariant') {
          expect(firstVariant.dimensions.width).toBe(150)
          expect(firstVariant.dimensions.length).toBe(300)
          expect(firstVariant.price).toBe(25000)
        }
      }
    })

    it('sets publishedAt from event timestamp', async () => {
      const product = createPilotProduct()
      const customTimestamp = new Date('2024-06-15T10:30:00Z')
      const event = MakePilotProductPublished({
        productId: product.id,
        product,
        correlationId: MakeCorrelationId('test-correlation-id'),
        userId: MakeUserId('test-user'),
        timestamp: customTimestamp,
      })

      await Effect.runPromise(catalogProjectionHandler(event).pipe(Effect.provide(testLayer)))

      const repo = await Effect.runPromise(
        Effect.gen(function* () {
          return yield* CatalogProductRepository
        }).pipe(Effect.provide(testLayer))
      )

      const saved = await Effect.runPromise(repo.findById(product.id))

      if (saved._tag === 'Some') {
        expect(saved.value.publishedAt).toEqual(customTimestamp)
      }
    })
  })

  describe('PilotProductUpdated event', () => {
    it('upserts existing catalog product on update', async () => {
      const product = createPilotProduct()
      const publishedEvent = buildPublishedEvent(product)

      // First publish
      await Effect.runPromise(
        catalogProjectionHandler(publishedEvent).pipe(Effect.provide(testLayer))
      )

      // Then update with new label
      const updatedProduct = createPilotProduct({
        label: 'Updated Label' as any,
      })
      const updatedEvent = buildUpdatedEvent(updatedProduct)

      await Effect.runPromise(
        catalogProjectionHandler(updatedEvent).pipe(Effect.provide(testLayer))
      )

      const repo = await Effect.runPromise(
        Effect.gen(function* () {
          return yield* CatalogProductRepository
        }).pipe(Effect.provide(testLayer))
      )

      const saved = await Effect.runPromise(repo.findById(product.id))

      if (saved._tag === 'Some') {
        expect(saved.value.label).toBe('Updated Label')
      }
    })
  })

  describe('edge cases', () => {
    it('handles product with empty additional views', async () => {
      const product = createPilotProduct({
        views: {
          front: { viewType: ViewType.FRONT, imageUrl: 'https://cdn.example.com/front.jpg' as any },
          detail: {
            viewType: ViewType.DETAIL,
            imageUrl: 'https://cdn.example.com/detail.jpg' as any,
          },
          additional: [],
        },
      })
      const event = buildPublishedEvent(product)

      await Effect.runPromise(catalogProjectionHandler(event).pipe(Effect.provide(testLayer)))

      const repo = await Effect.runPromise(
        Effect.gen(function* () {
          return yield* CatalogProductRepository
        }).pipe(Effect.provide(testLayer))
      )

      const saved = await Effect.runPromise(repo.findById(product.id))

      if (saved._tag === 'Some') {
        expect(saved.value.images.gallery).toHaveLength(0)
      }
    })
  })
})
