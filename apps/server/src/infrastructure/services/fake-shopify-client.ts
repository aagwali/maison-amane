// src/infrastructure/services/fake-shopify-client.ts
//
// Fake Shopify client for development/testing
// TODO: Replace with real GraphQL client implementation

import { Effect, Layer } from 'effect'

import { ShopifyClient } from '../../ports/driven'
import type { ShopifyProductId } from '../../domain/pilot'
import type {
  ShopifyProductSetInput,
  ShopifyProductSetResponse,
} from '../../application/shopify/dtos'

// ============================================
// FAKE SHOPIFY CLIENT
// ============================================

const fakeShopifyClient = () => ({
  productSet: (input: ShopifyProductSetInput): Effect.Effect<ShopifyProductSetResponse> =>
    Effect.gen(function* () {
      yield* Effect.logInfo('Fake Shopify client: productSet called').pipe(
        Effect.annotateLogs({
          title: input.title,
          handle: input.handle,
          variantsCount: input.variants.length,
        })
      )

      // Simulate API delay
      yield* Effect.sleep('100 millis')

      // Generate fake Shopify product ID (format: gid://shopify/Product/123456789)
      const fakeId = `gid://shopify/Product/${Date.now()}`

      yield* Effect.logInfo('Fake Shopify client: product created').pipe(
        Effect.annotateLogs({
          shopifyProductId: fakeId,
        })
      )

      return {
        product: { id: fakeId },
        userErrors: [],
      }
    }),

  productArchive: (productId: ShopifyProductId): Effect.Effect<void> =>
    Effect.gen(function* () {
      yield* Effect.logInfo('Fake Shopify client: productArchive called').pipe(
        Effect.annotateLogs({
          shopifyProductId: productId,
        })
      )

      // Simulate API delay
      yield* Effect.sleep('100 millis')

      yield* Effect.logInfo('Fake Shopify client: product archived').pipe(
        Effect.annotateLogs({
          shopifyProductId: productId,
        })
      )
    }),
})

export const FakeShopifyClientLive = Layer.succeed(ShopifyClient, fakeShopifyClient())
