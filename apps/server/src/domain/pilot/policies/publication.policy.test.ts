// src/domain/pilot/policies/publication.policy.test.ts

import { Effect } from 'effect'
import { describe, expect, it } from 'vitest'

import { ProductStatus } from '../enums'
import type { PilotProduct } from '../aggregate'

import { canPublish, PublicationNotAllowed } from './publication.policy'

// ============================================
// TEST FIXTURES
// ============================================

const baseProduct = {
  _tag: 'PilotProduct',
  id: 'test-id',
  label: 'Test Product',
  type: 'CARPET',
  category: 'LIVING_ROOM',
  description: 'Test description',
  priceRange: 'STANDARD',
  variants: [],
  views: { front: {}, detail: {}, additional: [] },
  syncStatus: { _tag: 'NotSynced' },
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as PilotProduct

// ============================================
// TESTS
// ============================================

describe('canPublish policy', () => {
  it('allows publishing a DRAFT product', async () => {
    const draftProduct = { ...baseProduct, status: ProductStatus.DRAFT }

    const result = await Effect.runPromise(canPublish(draftProduct))

    expect(result).toBeUndefined()
  })

  it('rejects publishing an already PUBLISHED product', async () => {
    const publishedProduct = { ...baseProduct, status: ProductStatus.PUBLISHED }

    const result = await Effect.runPromise(Effect.either(canPublish(publishedProduct)))

    expect(result._tag).toBe('Left')
    if (result._tag === 'Left') {
      expect(result.left).toBeInstanceOf(PublicationNotAllowed)
      expect(result.left.reason).toBe('Product is already published')
    }
  })

  it('rejects publishing an ARCHIVED product', async () => {
    const archivedProduct = { ...baseProduct, status: ProductStatus.ARCHIVED }

    const result = await Effect.runPromise(Effect.either(canPublish(archivedProduct)))

    expect(result._tag).toBe('Left')
    if (result._tag === 'Left') {
      expect(result.left).toBeInstanceOf(PublicationNotAllowed)
      expect(result.left.reason).toBe('Cannot publish an archived product')
    }
  })
})
