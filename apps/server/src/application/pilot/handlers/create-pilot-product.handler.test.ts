// src/application/pilot/handlers/create-pilot-product.handler.test.ts
//
// INTEGRATION TESTS: Tests the full handler flow with TestLayer.
// Uses real in-memory repository, deterministic IDs, fixed clock, and spy publisher.

import { runPromise, provide, either } from 'effect/Effect'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  PriceRange,
  ProductCategory,
  ProductStatus,
  ProductType,
  Size,
  ValidationError,
  ViewType,
} from '../../../domain/pilot'
import { makeCorrelationId, makeUserId } from '../../../domain/shared'
import { provideTestLayer, TEST_DATE } from '../../../test-utils'
import { makePilotProductCreationCommand, type UnvalidatedProductData } from '../commands'

import { handlePilotProductCreation } from './create-pilot-product.handler'

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

const buildCommand = (data: UnvalidatedProductData = validProductData) =>
  makePilotProductCreationCommand({
    data,
    correlationId: makeCorrelationId('test-correlation-id'),
    userId: makeUserId('test-user'),
    timestamp: TEST_DATE,
  })

// ============================================
// TESTS
// ============================================

describe('handlePilotProductCreation', () => {
  let testCtx: ReturnType<typeof provideTestLayer>

  beforeEach(() => {
    testCtx = provideTestLayer()
  })

  describe('success cases', () => {
    it('creates a product with deterministic ID', async () => {
      const command = buildCommand()

      const result = await runPromise(
        handlePilotProductCreation(command)
          .pipe(provide(testCtx.layer))
      )

      expect(result.id).toBe('test-product-1')
      expect(result.label).toBe('Tapis Berbère Atlas')
    })

    it('creates product with correct timestamps from fixed clock', async () => {
      const command = buildCommand()

      const result = await runPromise(
        handlePilotProductCreation(command)
          .pipe(provide(testCtx.layer))
      )

      expect(result.createdAt).toEqual(TEST_DATE)
      expect(result.updatedAt).toEqual(TEST_DATE)
    })

    it('creates variants as value objects with correct sizes', async () => {
      const command = buildCommand()

      const result = await runPromise(
        handlePilotProductCreation(command)
          .pipe(provide(testCtx.layer))
      )

      expect(result.variants).toHaveLength(2)
      expect(result.variants[0]?._tag).toBe('StandardVariant')
      expect(result.variants[0]?.size).toBe(Size.REGULAR)
      expect(result.variants[1]?._tag).toBe('StandardVariant')
      expect(result.variants[1]?.size).toBe(Size.LARGE)
    })

    it('initializes syncStatus as NotSynced', async () => {
      const command = buildCommand()

      const result = await runPromise(
        handlePilotProductCreation(command)
          .pipe(provide(testCtx.layer))
      )

      expect(result.syncStatus._tag).toBe('NotSynced')
    })

    it('structures views correctly', async () => {
      const command = buildCommand()

      const result = await runPromise(
        handlePilotProductCreation(command)
          .pipe(provide(testCtx.layer))
      )

      expect(result.views.front.viewType).toBe(ViewType.FRONT)
      expect(result.views.detail.viewType).toBe(ViewType.DETAIL)
      expect(result.views.additional).toHaveLength(2)
    })

    it('handles custom variant with dimensions', async () => {
      const dataWithCustom: UnvalidatedProductData = {
        ...validProductData,
        variants: [
          {
            size: Size.CUSTOM,
            customDimensions: { width: 150, length: 300 },
            price: 25000,
          },
        ],
      }
      const command = buildCommand(dataWithCustom)

      const result = await runPromise(
        handlePilotProductCreation(command)
          .pipe(provide(testCtx.layer))
      )

      expect(result.variants[0]._tag).toBe('CustomVariant')
      if (result.variants[0]._tag === 'CustomVariant') {
        expect(result.variants[0].customDimensions.width).toBe(150)
        expect(result.variants[0].customDimensions.length).toBe(300)
        expect(result.variants[0].price).toBe(25000)
      }
    })
  })

  describe('event emission', () => {
    it('does NOT emit event for DRAFT status', async () => {
      const command = buildCommand({ ...validProductData, status: ProductStatus.DRAFT })

      await runPromise(handlePilotProductCreation(command)
        .pipe(provide(testCtx.layer)))

      expect(testCtx.eventSpy.emittedEvents).toHaveLength(0)
    })

    it('emits PilotProductPublished for PUBLISHED status', async () => {
      const command = buildCommand({ ...validProductData, status: ProductStatus.PUBLISHED })

      await runPromise(handlePilotProductCreation(command)
        .pipe(provide(testCtx.layer)))

      expect(testCtx.eventSpy.emittedEvents).toHaveLength(1)
      expect(testCtx.eventSpy.lastEvent?._tag).toBe('PilotProductPublished')
    })

    it('includes product and correlation info in event', async () => {
      const command = buildCommand({ ...validProductData, status: ProductStatus.PUBLISHED })

      await runPromise(handlePilotProductCreation(command)
        .pipe(provide(testCtx.layer)))

      const event = testCtx.eventSpy.lastEvent
      expect(event?.productId).toBe('test-product-1')
      expect(event?.correlationId).toBe('test-correlation-id')
      expect(event?.userId).toBe('test-user')
      expect(event?._version).toBe(1)
    })
  })

  describe('validation errors', () => {
    it('propagates ValidationError from invalid input', async () => {
      const command = buildCommand({ ...validProductData, label: '   ' })

      const result = await runPromise(
        handlePilotProductCreation(command)
          .pipe(either, provide(testCtx.layer))
      )

      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {
        expect(result.left).toBeInstanceOf(ValidationError)
      }
    })
  })
})
