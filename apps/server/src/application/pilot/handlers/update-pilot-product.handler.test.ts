// src/application/pilot/handlers/update-pilot-product.handler.test.ts
//
// INTEGRATION TESTS: Tests the full handler flow with TestLayer.
// Uses real in-memory repository, deterministic IDs, fixed clock, and spy publisher.

import { runPromise, provide, either } from 'effect/Effect'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  ArchiveNotAllowed,
  makeProductId,
  PriceRange,
  ProductCategory,
  ProductNotFoundError,
  ProductStatus,
  ProductType,
  PublicationNotAllowed,
  Size,
  ValidationError,
  ViewType,
} from '../../../domain/pilot'
import { makeCorrelationId, makeUserId } from '../../../domain/shared'
import { provideTestLayer, TEST_DATE } from '../../../test-utils'
import {
  makePilotProductCreationCommand,
  makePilotProductUpdateCommand,
  type UnvalidatedProductData,
  type UnvalidatedUpdateData,
} from '../commands'

import { pilotProductCreationHandler } from './create-pilot-product.handler'
import { pilotProductUpdateHandler } from './update-pilot-product.handler'

// ============================================
// TEST FIXTURES
// ============================================

const validProductData: UnvalidatedProductData = {
  label: 'Tapis Berbère Atlas',
  type: ProductType.TAPIS,
  category: ProductCategory.RUNNER,
  description: 'Beautiful handmade Berber rug from the Atlas mountains',
  priceRange: PriceRange.PREMIUM,
  variants: [{ size: Size.REGULAR }, { size: Size.LARGE }],
  views: [
    { viewType: ViewType.FRONT, imageUrl: 'https://cdn.example.com/front.jpg' },
    { viewType: ViewType.DETAIL, imageUrl: 'https://cdn.example.com/detail.jpg' },
    { viewType: ViewType.BACK, imageUrl: 'https://cdn.example.com/back.jpg' },
    { viewType: ViewType.AMBIANCE, imageUrl: 'https://cdn.example.com/ambiance.jpg' },
  ],
  status: ProductStatus.DRAFT,
}

const buildCreateCommand = (data: UnvalidatedProductData = validProductData) =>
  makePilotProductCreationCommand({
    data,
    correlationId: makeCorrelationId('test-correlation-id'),
    userId: makeUserId('test-user'),
    timestamp: TEST_DATE,
  })

const buildUpdateCommand = (productId: string, data: UnvalidatedUpdateData = {}) =>
  makePilotProductUpdateCommand({
    productId: makeProductId(productId),
    data,
    correlationId: makeCorrelationId('test-correlation-id'),
    userId: makeUserId('test-user'),
    timestamp: TEST_DATE,
  })

// ============================================
// TESTS
// ============================================

describe('handlePilotProductUpdateHandler', () => {
  let testCtx: ReturnType<typeof provideTestLayer>

  beforeEach(() => {
    testCtx = provideTestLayer()
  })

  describe('success cases', () => {
    it('updates product label', async () => {
      // First create a product
      const createCommand = buildCreateCommand()
      await runPromise(pilotProductCreationHandler(createCommand)
        .pipe(provide(testCtx.layer)))

      // Then update it
      const updateCommand = buildUpdateCommand('test-product-1', {
        label: 'Nouveau Label',
      })

      const result = await runPromise(
        pilotProductUpdateHandler(updateCommand)
          .pipe(provide(testCtx.layer))
      )

      expect(result.id).toBe('test-product-1')
      expect(result.label).toBe('Nouveau Label')
    })

    it('preserves unchanged fields', async () => {
      const createCommand = buildCreateCommand()
      await runPromise(pilotProductCreationHandler(createCommand)
        .pipe(provide(testCtx.layer)))

      const updateCommand = buildUpdateCommand('test-product-1', {
        label: 'Nouveau Label',
      })

      const result = await runPromise(
        pilotProductUpdateHandler(updateCommand)
          .pipe(provide(testCtx.layer))
      )

      // Unchanged fields should be preserved
      expect(result.type).toBe(ProductType.TAPIS)
      expect(result.category).toBe(ProductCategory.RUNNER)
      expect(result.description).toBe('Beautiful handmade Berber rug from the Atlas mountains')
      expect(result.priceRange).toBe(PriceRange.PREMIUM)
    })

    it('preserves immutable fields (id, createdAt)', async () => {
      const createCommand = buildCreateCommand()
      const created = await runPromise(
        pilotProductCreationHandler(createCommand)
          .pipe(provide(testCtx.layer))
      )

      const updateCommand = buildUpdateCommand('test-product-1', {
        label: 'Nouveau Label',
      })

      const result = await runPromise(
        pilotProductUpdateHandler(updateCommand)
          .pipe(provide(testCtx.layer))
      )

      expect(result.id).toBe(created.id)
      expect(result.createdAt).toEqual(created.createdAt)
    })

    it('updates updatedAt timestamp', async () => {
      const createCommand = buildCreateCommand()
      const _created = await runPromise(
        pilotProductCreationHandler(createCommand)
          .pipe(provide(testCtx.layer))
      )

      const updateCommand = buildUpdateCommand('test-product-1', {
        label: 'Nouveau Label',
      })

      const result = await runPromise(
        pilotProductUpdateHandler(updateCommand)
          .pipe(provide(testCtx.layer))
      )

      // updatedAt should be updated (using TEST_DATE from fixed clock)
      expect(result.updatedAt).toEqual(TEST_DATE)
    })

    it('updates status from DRAFT to PUBLISHED', async () => {
      const createCommand = buildCreateCommand()
      await runPromise(pilotProductCreationHandler(createCommand)
        .pipe(provide(testCtx.layer)))

      const updateCommand = buildUpdateCommand('test-product-1', {
        status: ProductStatus.PUBLISHED,
      })

      const result = await runPromise(
        pilotProductUpdateHandler(updateCommand)
          .pipe(provide(testCtx.layer))
      )

      expect(result.status).toBe(ProductStatus.PUBLISHED)
    })

    it('updates multiple fields at once', async () => {
      const createCommand = buildCreateCommand()
      await runPromise(pilotProductCreationHandler(createCommand)
        .pipe(provide(testCtx.layer)))

      const updateCommand = buildUpdateCommand('test-product-1', {
        label: 'Nouveau Label',
        description: 'Nouvelle description',
        priceRange: PriceRange.DISCOUNT,
      })

      const result = await runPromise(
        pilotProductUpdateHandler(updateCommand)
          .pipe(provide(testCtx.layer))
      )

      expect(result.label).toBe('Nouveau Label')
      expect(result.description).toBe('Nouvelle description')
      expect(result.priceRange).toBe(PriceRange.DISCOUNT)
    })

    it('preserves syncStatus', async () => {
      const createCommand = buildCreateCommand()
      await runPromise(pilotProductCreationHandler(createCommand)
        .pipe(provide(testCtx.layer)))

      const updateCommand = buildUpdateCommand('test-product-1', {
        label: 'Nouveau Label',
      })

      const result = await runPromise(
        pilotProductUpdateHandler(updateCommand)
          .pipe(provide(testCtx.layer))
      )

      expect(result.syncStatus._tag).toBe('NotSynced')
    })
  })

  describe('event emission', () => {
    it('does NOT emit event for DRAFT status', async () => {
      const createCommand = buildCreateCommand()
      await runPromise(pilotProductCreationHandler(createCommand)
        .pipe(provide(testCtx.layer)))
      testCtx.eventSpy.clear() // Clear events from creation

      const updateCommand = buildUpdateCommand('test-product-1', {
        label: 'Nouveau Label',
      })

      runPromise(pilotProductUpdateHandler(updateCommand)
        .pipe(provide(testCtx.layer)))

      expect(testCtx.eventSpy.emittedEvents).toHaveLength(0)
    })

    it('emits PilotProductUpdated for PUBLISHED status', async () => {
      const createCommand = buildCreateCommand({
        ...validProductData,
        status: ProductStatus.PUBLISHED,
      })
      await runPromise(pilotProductCreationHandler(createCommand)
        .pipe(provide(testCtx.layer)))
      testCtx.eventSpy.clear() // Clear events from creation

      const updateCommand = buildUpdateCommand('test-product-1', {
        label: 'Nouveau Label',
      })

      await runPromise(pilotProductUpdateHandler(updateCommand)
        .pipe(provide(testCtx.layer)))

      expect(testCtx.eventSpy.emittedEvents).toHaveLength(1)
      expect(testCtx.eventSpy.lastEvent?._tag).toBe('PilotProductUpdated')
    })

    it('emits PilotProductUpdated for ARCHIVED status', async () => {
      const createCommand = buildCreateCommand()
      await runPromise(pilotProductCreationHandler(createCommand)
        .pipe(provide(testCtx.layer)))
      testCtx.eventSpy.clear() // Clear events from creation

      const updateCommand = buildUpdateCommand('test-product-1', {
        status: ProductStatus.ARCHIVED,
      })

      await runPromise(pilotProductUpdateHandler(updateCommand)
        .pipe(provide(testCtx.layer)))

      expect(testCtx.eventSpy.emittedEvents).toHaveLength(1)
      expect(testCtx.eventSpy.lastEvent?._tag).toBe('PilotProductUpdated')
    })

    it('includes product and correlation info in event', async () => {
      const createCommand = buildCreateCommand({
        ...validProductData,
        status: ProductStatus.PUBLISHED,
      })
      await runPromise(pilotProductCreationHandler(createCommand)
        .pipe(provide(testCtx.layer)))
      testCtx.eventSpy.clear() // Clear events from creation

      const updateCommand = buildUpdateCommand('test-product-1', {
        label: 'Nouveau Label',
      })

      await runPromise(pilotProductUpdateHandler(updateCommand)
        .pipe(provide(testCtx.layer)))

      const event = testCtx.eventSpy.lastEvent
      expect(event?.productId).toBe('test-product-1')
      expect(event?.correlationId).toBe('test-correlation-id')
      expect(event?.userId).toBe('test-user')
      expect(event?._version).toBe(1)
    })
  })

  describe('error cases', () => {
    it('fails with ProductNotFoundError for non-existent product', async () => {
      const updateCommand = buildUpdateCommand('non-existent-id', {
        label: 'Nouveau Label',
      })

      const result = await runPromise(
        pilotProductUpdateHandler(updateCommand)
          .pipe(either, provide(testCtx.layer))
      )

      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(ProductNotFoundError)
        expect((result.left as ProductNotFoundError).productId).toBe('non-existent-id')
      }
    })

    it('fails with ValidationError for invalid label', async () => {
      const createCommand = buildCreateCommand()
      await runPromise(pilotProductCreationHandler(createCommand)
        .pipe(provide(testCtx.layer)))

      const updateCommand = buildUpdateCommand('test-product-1', {
        label: '   ', // Invalid: empty after trim
      })

      const result = await runPromise(
        pilotProductUpdateHandler(updateCommand)
          .pipe(either, provide(testCtx.layer))
      )

      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(ValidationError)
      }
    })

    it('fails with ValidationError for invalid status', async () => {
      const createCommand = buildCreateCommand()
      await runPromise(pilotProductCreationHandler(createCommand)
        .pipe(provide(testCtx.layer)))

      const updateCommand = buildUpdateCommand('test-product-1', {
        status: 'INVALID_STATUS' as ProductStatus,
      })

      const result = await runPromise(
        pilotProductUpdateHandler(updateCommand)
          .pipe(either, provide(testCtx.layer))
      )

      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(ValidationError)
      }
    })

    it('fails with PublicationNotAllowed when publishing an ARCHIVED product', async () => {
      // Create and archive a product
      const createCommand = buildCreateCommand()
      await runPromise(pilotProductCreationHandler(createCommand)
        .pipe(provide(testCtx.layer)))
      await runPromise(
        pilotProductUpdateHandler(
          buildUpdateCommand('test-product-1', { status: ProductStatus.ARCHIVED })
        )
          .pipe(provide(testCtx.layer))
      )

      // Try to publish the archived product
      const updateCommand = buildUpdateCommand('test-product-1', {
        status: ProductStatus.PUBLISHED,
      })

      const result = await runPromise(
        pilotProductUpdateHandler(updateCommand)
          .pipe(either, provide(testCtx.layer))
      )

      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(PublicationNotAllowed)
      }
    })

    it('fails with ArchiveNotAllowed when archiving an already ARCHIVED product', async () => {
      // Create and archive a product
      const createCommand = buildCreateCommand()
      await runPromise(pilotProductCreationHandler(createCommand)
        .pipe(provide(testCtx.layer)))
      await runPromise(
        pilotProductUpdateHandler(
          buildUpdateCommand('test-product-1', { status: ProductStatus.ARCHIVED })
        )
          .pipe(provide(testCtx.layer))
      )

      // Try to archive again
      const updateCommand = buildUpdateCommand('test-product-1', {
        status: ProductStatus.ARCHIVED,
      })

      const result = await runPromise(
        pilotProductUpdateHandler(updateCommand)
          .pipe(either, provide(testCtx.layer))
      )

      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(ArchiveNotAllowed)
      }
    })
  })
})
