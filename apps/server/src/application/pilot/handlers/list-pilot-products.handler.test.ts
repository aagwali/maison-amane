// src/application/pilot/handlers/list-pilot-products.handler.test.ts
//
// INTEGRATION TESTS: Tests the full handler flow with TestLayer.
// Uses real in-memory repository, deterministic IDs, fixed clock, and spy publisher.

import { runPromise, provide } from 'effect/Effect'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  PriceRange,
  ProductCategory,
  ProductStatus,
  ProductType,
  Size,
  ViewType,
} from '../../../domain/pilot'
import { makeCorrelationId, makeUserId } from '../../../domain/shared'
import { provideTestLayer, TEST_DATE } from '../../../test-utils'
import { makePilotProductCreationCommand, type UnvalidatedProductData } from '../commands'
import { makeListPilotProductsQuery } from '../queries'

import { pilotProductCreationHandler } from './create-pilot-product.handler'
import { listPilotProductsHandler } from './list-pilot-products.handler'

// ============================================
// TEST FIXTURES
// ============================================

const validProductData: UnvalidatedProductData = {
  label: 'Tapis Berbère Atlas',
  type: ProductType.TAPIS,
  category: ProductCategory.RUNNER,
  description: 'Beautiful handmade Berber rug from the Atlas mountains',
  priceRange: PriceRange.PREMIUM,
  variants: [{ size: Size.REGULAR }],
  views: [
    { viewType: ViewType.FRONT, imageUrl: 'https://cdn.example.com/front.jpg' },
    { viewType: ViewType.DETAIL, imageUrl: 'https://cdn.example.com/detail.jpg' },
  ],
  status: ProductStatus.DRAFT,
}

const buildCreateCommand = (overrides: Partial<UnvalidatedProductData> = {}) =>
  makePilotProductCreationCommand({
    data: { ...validProductData, ...overrides },
    correlationId: makeCorrelationId('test-correlation-id'),
    userId: makeUserId('test-user'),
    timestamp: TEST_DATE,
  })

// ============================================
// TESTS
// ============================================

describe('listPilotProductsHandler', () => {
  let testCtx: ReturnType<typeof provideTestLayer>

  beforeEach(() => {
    testCtx = provideTestLayer()
  })

  describe('success cases', () => {
    it('returns an empty array when no products exist', async () => {
      const query = makeListPilotProductsQuery()

      const result = await runPromise(listPilotProductsHandler(query)
        .pipe(provide(testCtx.layer)))

      expect(result).toEqual([])
    })

    it('returns all products after creation', async () => {
      const createCommand1 = buildCreateCommand({ label: 'Tapis 1' })
      const createCommand2 = buildCreateCommand({ label: 'Tapis 2' })

      await runPromise(pilotProductCreationHandler(createCommand1)
        .pipe(provide(testCtx.layer)))
      await runPromise(pilotProductCreationHandler(createCommand2)
        .pipe(provide(testCtx.layer)))

      const query = makeListPilotProductsQuery()
      const result = await runPromise(listPilotProductsHandler(query)
        .pipe(provide(testCtx.layer)))

      expect(result).toHaveLength(2)
    })

    it('returns products with correct field values', async () => {
      const createCommand = buildCreateCommand()

      const created = await runPromise(
        pilotProductCreationHandler(createCommand)
          .pipe(provide(testCtx.layer))
      )

      const query = makeListPilotProductsQuery()
      const result = await runPromise(listPilotProductsHandler(query)
        .pipe(provide(testCtx.layer)))

      // Find the product we just created by its deterministic ID
      const found = result.find((p) => p.id === created.id)
      expect(found).toBeDefined()
      expect(found?._tag).toBe('PilotProduct')
      expect(found?.label).toBe('Tapis Berbère Atlas')
    })

    it('returns products with deterministic IDs', async () => {
      await runPromise(
        pilotProductCreationHandler(buildCreateCommand({ label: 'A' }))
          .pipe(provide(testCtx.layer))
      )
      await runPromise(
        pilotProductCreationHandler(buildCreateCommand({ label: 'B' }))
          .pipe(provide(testCtx.layer))
      )

      const query = makeListPilotProductsQuery()
      const result = await runPromise(listPilotProductsHandler(query)
        .pipe(provide(testCtx.layer)))

      const ids = result.map((p) => p.id).sort()
      expect(ids).toContain('test-product-1')
      expect(ids).toContain('test-product-2')
    })
  })
})
