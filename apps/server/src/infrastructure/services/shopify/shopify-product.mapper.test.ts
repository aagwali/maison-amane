// src/infrastructure/services/shopify/__tests__/shopify-product.mapper.test.ts
//
// UNIT TESTS: mapToShopifyProduct mapper (pure function, no Layer needed)

import { describe, expect, it } from 'vitest'

import {
  makePilotProduct,
  makeNotSynced,
  makeSynced,
  makeShopifyProductId,
  Material,
  ProductType,
  ViewType,
  type PilotProduct,
  type PositiveCm,
  type Price,
} from '../../../domain/pilot'

import { mapToShopifyProduct } from './shopify-product.mapper'

// ============================================
// FIXTURES
// ============================================

const now = new Date('2024-01-15T10:00:00Z')

const catalogRegularVariant = {
  sizeSpec: { _tag: 'CatalogSize' as const, size: 'MEDIUM' as const },
  pricingSpec: { _tag: 'FormulaPrice' as const },
}

const buildProduct = (overrides: Partial<PilotProduct> = {}): PilotProduct =>
  makePilotProduct({
    id: 'test-product-1' as any,
    label: 'Tapis Berbère Atlas' as any,
    type: ProductType.TAPIS,
    shape: 'RUNNER' as any,
    description: 'Beautiful handmade rug' as any,
    material: Material.AZILAL,
    variants: [catalogRegularVariant],
    views: {
      front: { viewType: ViewType.FRONT, imageUrl: 'https://cdn.example.com/front.jpg' as any },
      detail: { viewType: ViewType.DETAIL, imageUrl: 'https://cdn.example.com/detail.jpg' as any },
      additional: [],
    },
    status: 'PUBLISHED' as any,
    syncStatus: makeNotSynced(),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  })

// ============================================
// STATUS MAPPING
// ============================================

describe('mapToShopifyProduct — status', () => {
  it('maps to DRAFT (not ACTIVE)', () => {
    const input = mapToShopifyProduct(buildProduct())
    expect(input.status).toBe('DRAFT')
  })
})

// ============================================
// ID PASSTHROUGH (upsert behaviour)
// ============================================

describe('mapToShopifyProduct — id passthrough', () => {
  it('omits id when product is NotSynced', () => {
    const product = buildProduct({ syncStatus: makeNotSynced() })
    const input = mapToShopifyProduct(product)
    expect(input.id).toBeUndefined()
  })

  it('includes Shopify GID when product is Synced', () => {
    const shopifyId = makeShopifyProductId('gid://shopify/Product/123456789')
    const product = buildProduct({
      syncStatus: makeSynced({ shopifyProductId: shopifyId, syncedAt: now }),
    })
    const input = mapToShopifyProduct(product)
    expect(input.id).toBe('gid://shopify/Product/123456789')
  })
})

// ============================================
// CORE FIELDS
// ============================================

describe('mapToShopifyProduct — core fields', () => {
  it('maps title from product label', () => {
    const input = mapToShopifyProduct(buildProduct())
    expect(input.title).toBe('Tapis Berbère Atlas')
  })

  it('maps handle as slugified label', () => {
    const input = mapToShopifyProduct(buildProduct())
    expect(input.handle).toBe('tapis-berbere-atlas')
  })

  it('maps vendor to Maison Amane', () => {
    const input = mapToShopifyProduct(buildProduct())
    expect(input.vendor).toBe('Maison Amane')
  })

  it('maps productType as "type - shape"', () => {
    const input = mapToShopifyProduct(buildProduct())
    expect(input.productType).toBe('TAPIS - RUNNER')
  })

  it('includes shape and material as lowercase tags', () => {
    const input = mapToShopifyProduct(buildProduct())
    expect(input.tags).toContain('runner')
    expect(input.tags).toContain('azilal')
  })
})

// ============================================
// VARIANTS & PRICING
// ============================================

describe('mapToShopifyProduct — variants', () => {
  it('maps catalog variant with formula price', () => {
    const input = mapToShopifyProduct(buildProduct())
    expect(input.variants).toHaveLength(1)
    const variant = input.variants[0]!
    expect(variant.price).toMatch(/^\d+\.\d{2}$/)
    expect(variant.optionValues[0]!.optionName).toBe('Dimensions')
  })

  it('maps bespoke variant with custom dimensions', () => {
    const product = buildProduct({
      variants: [
        {
          sizeSpec: { _tag: 'BespokeSize', width: 120 as PositiveCm, length: 200 as PositiveCm },
          pricingSpec: { _tag: 'FormulaPrice' },
        },
      ],
    })
    const input = mapToShopifyProduct(product)
    expect(input.variants).toHaveLength(1)
    expect(input.variants[0]!.optionValues[0]!.name).toBe('120x200')
  })

  it('uses negotiated price when pricingSpec is NegotiatedPrice', () => {
    const product = buildProduct({
      variants: [
        {
          sizeSpec: { _tag: 'CatalogSize', size: 'MEDIUM' as const },
          pricingSpec: { _tag: 'NegotiatedPrice', amount: 85000 as Price },
        },
      ],
    })
    const input = mapToShopifyProduct(product)
    expect(input.variants[0]!.price).toBe('850.00')
  })

  it('deduplicates identical size labels in product options', () => {
    const product = buildProduct({
      variants: [catalogRegularVariant, catalogRegularVariant],
    })
    const input = mapToShopifyProduct(product)
    const option = input.productOptions.find((o) => o.name === 'Dimensions')!
    const names = option.values.map((v) => v.name)
    expect(new Set(names).size).toBe(names.length)
  })
})

// ============================================
// IMAGE FILES
// ============================================

describe('mapToShopifyProduct — files', () => {
  it('includes front and detail views', () => {
    const input = mapToShopifyProduct(buildProduct())
    const sources = input.files.map((f) => f.originalSource)
    expect(sources).toContain('https://cdn.example.com/front.jpg')
    expect(sources).toContain('https://cdn.example.com/detail.jpg')
  })

  it('includes additional views when present', () => {
    const product = buildProduct({
      views: {
        front: { viewType: ViewType.FRONT, imageUrl: 'https://cdn.example.com/front.jpg' as any },
        detail: {
          viewType: ViewType.DETAIL,
          imageUrl: 'https://cdn.example.com/detail.jpg' as any,
        },
        additional: [
          { viewType: ViewType.BACK, imageUrl: 'https://cdn.example.com/back.jpg' as any },
        ],
      },
    })
    const input = mapToShopifyProduct(product)
    expect(input.files).toHaveLength(3)
    expect(input.files[2]!.originalSource).toBe('https://cdn.example.com/back.jpg')
  })

  it('sets contentType IMAGE on all files', () => {
    const input = mapToShopifyProduct(buildProduct())
    expect(input.files.every((f) => f.contentType === 'IMAGE')).toBe(true)
  })
})
