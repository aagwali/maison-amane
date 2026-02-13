// src/domain/pilot/aggregate.test.ts
//
// UNIT TESTS: Pure aggregate methods, no Effect Layer needed.
// Tests state transitions, sync status methods, and policies.

import { Effect } from 'effect'
import { describe, expect, it } from 'vitest'

import {
  archive,
  makePilotProduct,
  makeStandardVariant,
  makeNotSynced,
  makeSynced,
  makeSyncFailed,
  makeShopifyProductId,
  markSynced,
  markSyncFailed,
  ProductStatus,
  ProductType,
  PriceRange,
  publish,
  requiresChangeNotification,
  resetSyncStatus,
  ViewType,
  Size,
  type PilotProduct,
  type SyncError,
} from './index'

// ============================================
// TEST FIXTURES
// ============================================

const now = new Date('2024-01-15T10:00:00Z')

const createProduct = (overrides: Partial<PilotProduct> = {}): PilotProduct =>
  makePilotProduct({
    id: 'test-product-1' as any,
    label: 'Tapis Berbère Atlas' as any,
    type: ProductType.TAPIS,
    category: 'RUNNER' as any,
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
    status: ProductStatus.DRAFT,
    syncStatus: makeNotSynced(),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  })

const shopifyId = makeShopifyProductId('gid://shopify/Product/123456789')

const syncError: SyncError = {
  code: 'SHOPIFY_API_ERROR',
  message: 'Rate limit exceeded',
  details: { retryAfter: 60 },
}

// ============================================
// PUBLISH
// ============================================

describe('publish', () => {
  it('transitions DRAFT product to PUBLISHED', async () => {
    const product = createProduct({ status: ProductStatus.DRAFT })

    const result = await Effect.runPromise(publish(product, now))

    expect(result.status).toBe(ProductStatus.PUBLISHED)
    expect(result.updatedAt).toEqual(now)
  })

  it('rejects publishing an already PUBLISHED product', async () => {
    const product = createProduct({ status: ProductStatus.PUBLISHED })

    const result = await Effect.runPromise(Effect.either(publish(product, now)))

    expect(result._tag).toBe('Left')
    if (result._tag === 'Left') {
      expect(result.left._tag).toBe('PublicationNotAllowed')
      expect(result.left.reason).toBe('Product is already published')
    }
  })

  it('rejects publishing an ARCHIVED product', async () => {
    const product = createProduct({ status: ProductStatus.ARCHIVED })

    const result = await Effect.runPromise(Effect.either(publish(product, now)))

    expect(result._tag).toBe('Left')
    if (result._tag === 'Left') {
      expect(result.left._tag).toBe('PublicationNotAllowed')
      expect(result.left.reason).toBe('Cannot publish an archived product')
    }
  })
})

// ============================================
// ARCHIVE
// ============================================

describe('archive', () => {
  it('transitions DRAFT product to ARCHIVED', async () => {
    const product = createProduct({ status: ProductStatus.DRAFT })

    const result = await Effect.runPromise(archive(product, now))

    expect(result.status).toBe(ProductStatus.ARCHIVED)
    expect(result.updatedAt).toEqual(now)
  })

  it('transitions PUBLISHED product to ARCHIVED', async () => {
    const product = createProduct({ status: ProductStatus.PUBLISHED })

    const result = await Effect.runPromise(archive(product, now))

    expect(result.status).toBe(ProductStatus.ARCHIVED)
  })

  it('rejects archiving an already ARCHIVED product', async () => {
    const product = createProduct({ status: ProductStatus.ARCHIVED })

    const result = await Effect.runPromise(Effect.either(archive(product, now)))

    expect(result._tag).toBe('Left')
    if (result._tag === 'Left') {
      expect(result.left._tag).toBe('ArchiveNotAllowed')
      expect(result.left.reason).toBe('Product is already archived')
    }
  })
})

// ============================================
// MARK SYNCED
// ============================================

describe('markSynced', () => {
  it('updates syncStatus and updatedAt', () => {
    const product = createProduct()
    const syncedAt = new Date('2024-01-15T12:00:00Z')

    const result = markSynced(product, shopifyId, syncedAt)

    expect(result.syncStatus._tag).toBe('Synced')
    if (result.syncStatus._tag === 'Synced') {
      expect(result.syncStatus.shopifyProductId).toBe(shopifyId)
      expect(result.syncStatus.syncedAt).toEqual(syncedAt)
    }
    expect(result.updatedAt).toEqual(syncedAt)
  })
})

// ============================================
// MARK SYNC FAILED
// ============================================

describe('markSyncFailed', () => {
  it('sets SyncFailed with attempts = 1 on first failure', () => {
    const product = createProduct()
    const failedAt = new Date('2024-01-15T11:00:00Z')

    const result = markSyncFailed(product, syncError, failedAt)

    expect(result.syncStatus._tag).toBe('SyncFailed')
    if (result.syncStatus._tag === 'SyncFailed') {
      expect(result.syncStatus.attempts).toBe(1)
      expect(result.syncStatus.error).toEqual(syncError)
      expect(result.syncStatus.failedAt).toEqual(failedAt)
    }
    expect(result.updatedAt).toEqual(failedAt)
  })

  it('increments attempts on subsequent failures', () => {
    const product = createProduct({
      syncStatus: makeSyncFailed({
        error: syncError,
        failedAt: new Date('2024-01-15T10:00:00Z'),
        attempts: 3,
      }),
    })
    const failedAt = new Date('2024-01-15T11:00:00Z')

    const result = markSyncFailed(product, syncError, failedAt)

    expect(result.syncStatus._tag).toBe('SyncFailed')
    if (result.syncStatus._tag === 'SyncFailed') {
      expect(result.syncStatus.attempts).toBe(4)
    }
  })
})

// ============================================
// RESET SYNC STATUS
// ============================================

describe('resetSyncStatus', () => {
  it('resets Synced to NotSynced', () => {
    const product = createProduct({
      syncStatus: makeSynced({ shopifyProductId: shopifyId, syncedAt: now }),
    })

    const result = resetSyncStatus(product, now)

    expect(result.syncStatus._tag).toBe('NotSynced')
    expect(result.updatedAt).toEqual(now)
  })

  it('resets SyncFailed to NotSynced', () => {
    const product = createProduct({
      syncStatus: makeSyncFailed({ error: syncError, failedAt: now, attempts: 5 }),
    })

    const result = resetSyncStatus(product, now)

    expect(result.syncStatus._tag).toBe('NotSynced')
  })
})

// ============================================
// REQUIRES CHANGE NOTIFICATION
// ============================================

describe('requiresChangeNotification', () => {
  it('returns true for PUBLISHED product', () => {
    const product = createProduct({ status: ProductStatus.PUBLISHED })
    expect(requiresChangeNotification(product)).toBe(true)
  })

  it('returns true for ARCHIVED product', () => {
    const product = createProduct({ status: ProductStatus.ARCHIVED })
    expect(requiresChangeNotification(product)).toBe(true)
  })

  it('returns false for DRAFT product', () => {
    const product = createProduct({ status: ProductStatus.DRAFT })
    expect(requiresChangeNotification(product)).toBe(false)
  })
})
