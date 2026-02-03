// src/infrastructure/services/shopify/fake-shopify-client.ts
//
// Fake Shopify client for development/testing.
// Implements the domain-oriented ShopifyClient port.

import { Effect, Layer } from 'effect'

import type { PilotProduct, ShopifyProductId } from '../../../domain/pilot'
import { ShopifyClient } from '../../../ports/driven'

import { mapToShopifyProduct } from './shopify-product.mapper'

// ============================================
// FAKE SHOPIFY CLIENT
// ============================================

const createFakeShopifyClient = () => ({
  syncProduct: (product: PilotProduct): Effect.Effect<ShopifyProductId> =>
    Effect.gen(function* () {
      // Map domain to Shopify format (anti-corruption layer)
      const shopifyInput = mapToShopifyProduct(product)

      yield* Effect.logInfo('Fake Shopify client: syncProduct called').pipe(
        Effect.annotateLogs({
          productId: product.id,
          title: shopifyInput.title,
          handle: shopifyInput.handle,
          variantsCount: shopifyInput.variants.length,
        })
      )

      // Simulate API delay
      yield* Effect.sleep('100 millis')

      // Generate fake Shopify product ID (format: gid://shopify/Product/123456789)
      const fakeId = `gid://shopify/Product/${Date.now()}` as ShopifyProductId

      yield* Effect.logInfo('Fake Shopify client: product synced').pipe(
        Effect.annotateLogs({
          shopifyProductId: fakeId,
        })
      )

      return fakeId
    }),

  archiveProduct: (shopifyProductId: ShopifyProductId): Effect.Effect<void> =>
    Effect.gen(function* () {
      yield* Effect.logInfo('Fake Shopify client: archiveProduct called').pipe(
        Effect.annotateLogs({
          shopifyProductId,
        })
      )

      // Simulate API delay
      yield* Effect.sleep('100 millis')

      yield* Effect.logInfo('Fake Shopify client: product archived').pipe(
        Effect.annotateLogs({
          shopifyProductId,
        })
      )
    }),
})

export const FakeShopifyClientLive = Layer.succeed(ShopifyClient, createFakeShopifyClient())
