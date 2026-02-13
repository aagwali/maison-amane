// src/infrastructure/services/shopify/fake-shopify-client.ts
//
// Fake Shopify client for development/testing.
// Implements the domain-oriented ShopifyClient port.

import { Layer } from 'effect'
import { type Effect, gen, logInfo, annotateLogs, sleep } from 'effect/Effect'

import type { PilotProduct, ShopifyProductId } from '../../../domain/pilot'
import { ShopifyClient } from '../../../ports/driven'

import { mapToShopifyProduct } from './shopify-product.mapper'

// ============================================
// FAKE SHOPIFY CLIENT
// ============================================

const createFakeShopifyClient = () => ({
  syncProduct: (product: PilotProduct): Effect<ShopifyProductId> =>
    gen(function* () {
      // Map domain to Shopify format (anti-corruption layer)
      const shopifyInput = mapToShopifyProduct(product)

      yield* logInfo('Fake Shopify client: syncProduct called')
        .pipe(annotateLogs({
          productId: product.id,
          title: shopifyInput.title,
          handle: shopifyInput.handle,
          variantsCount: shopifyInput.variants.length,
        }))

      // Simulate API delay
      yield* sleep('100 millis')

      // Generate fake Shopify product ID (format: gid://shopify/Product/123456789)
      const fakeId = `gid://shopify/Product/${Date.now()}` as ShopifyProductId

      yield* logInfo('Fake Shopify client: product synced')
        .pipe(annotateLogs({
          shopifyProductId: fakeId,
        }))

      return fakeId
    }),

  archiveProduct: (shopifyProductId: ShopifyProductId): Effect<void> =>
    gen(function* () {
      yield* logInfo('Fake Shopify client: archiveProduct called')
        .pipe(annotateLogs({
          shopifyProductId,
        }))

      // Simulate API delay
      yield* sleep('100 millis')

      yield* logInfo('Fake Shopify client: product archived')
        .pipe(annotateLogs({
          shopifyProductId,
        }))
    }),
})

export const FakeShopifyClientLive = Layer.succeed(ShopifyClient, createFakeShopifyClient())
