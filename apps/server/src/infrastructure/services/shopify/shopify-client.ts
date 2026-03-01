// src/infrastructure/services/shopify/shopify-client.ts
//
// Real Shopify Admin GraphQL client.
// Implements the ShopifyClient port using fetch + productSet mutation.
// Obtains access tokens dynamically via ShopifyTokenProvider (client credentials grant).

import { Layer, Redacted } from 'effect'
import { type Effect, gen, logInfo, logError, annotateLogs, tryPromise, fail } from 'effect/Effect'
import { ShopifyConfig, type ShopifyConfigValue } from '@maison-amane/shared-kernel'

import type { PilotProduct, ShopifyProductId } from '../../../domain/pilot'
import { ShopifyClient, ShopifyClientError } from '../../../ports/driven'

import { ShopifyTokenProvider, type ShopifyTokenProviderService } from './shopify-token-provider'
import { mapToShopifyProduct } from './shopify-product.mapper'
import type { ShopifyGraphQLResponse, ProductSetMutationData } from './dtos'

// ============================================
// GRAPHQL MUTATIONS
// ============================================

const PRODUCT_SET_MUTATION = `
  mutation productSet($input: ProductSetInput!) {
    productSet(input: $input, synchronous: true) {
      product {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`

const PRODUCT_ARCHIVE_MUTATION = `
  mutation productSet($input: ProductSetInput!) {
    productSet(input: $input, synchronous: true) {
      product {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`

// ============================================
// GRAPHQL CLIENT (internal helper)
// ============================================

const executeGraphQL = <T>(
  config: ShopifyConfigValue,
  tokenProvider: ShopifyTokenProviderService,
  query: string,
  variables: Record<string, unknown>
): Effect<T, ShopifyClientError> =>
  gen(function* () {
    const accessToken = yield* tokenProvider.getAccessToken

    const response = yield* tryPromise({
      try: async () => {
        const result = await fetch(
          `${config.storeUrl}/admin/api/${config.apiVersion}/graphql.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': Redacted.value(accessToken),
            },
            body: JSON.stringify({ query, variables }),
          }
        )
        if (!result.ok) {
          const body = await result.text().catch(() => '')
          throw new Error(`HTTP ${result.status}: ${result.statusText} — ${body}`)
        }
        return result.json() as Promise<ShopifyGraphQLResponse<T>>
      },
      catch: (error) => new ShopifyClientError({ operation: 'graphql', cause: error }),
    })

    if (response.errors && response.errors.length > 0) {
      yield* logError('Shopify GraphQL errors')
        .pipe(annotateLogs({ errors: JSON.stringify(response.errors) }))
      yield* fail(new ShopifyClientError({ operation: 'graphql', cause: response.errors }))
    }
    if (!response.data) {
      yield* logError('Shopify GraphQL returned no data')
        .pipe(annotateLogs({ response: JSON.stringify(response) }))
      yield* fail(new ShopifyClientError({ operation: 'graphql', cause: 'No data returned' }))
    }
    return response.data as T
  })

// ============================================
// SHOPIFY CLIENT IMPLEMENTATION
// ============================================

const createShopifyClient = (
  config: ShopifyConfigValue,
  tokenProvider: ShopifyTokenProviderService
) => ({
  syncProduct: (product: PilotProduct): Effect<ShopifyProductId, ShopifyClientError> =>
    gen(function* () {
      const shopifyInput = mapToShopifyProduct(product)

      yield* logInfo('Shopify client: syncing product')
        .pipe(annotateLogs({
          productId: product.id,
          title: shopifyInput.title,
          isUpdate: shopifyInput.id !== undefined,
        }))

      const data = yield* executeGraphQL<ProductSetMutationData>(
        config,
        tokenProvider,
        PRODUCT_SET_MUTATION,
        { input: shopifyInput }
      )

      const { productSet } = data

      if (productSet.userErrors.length > 0) {
        yield* fail(
          new ShopifyClientError({
            operation: 'syncProduct',
            cause: { userErrors: productSet.userErrors },
          })
        )
      }

      if (!productSet.product) {
        yield* fail(
          new ShopifyClientError({
            operation: 'syncProduct',
            cause: 'No product returned from Shopify',
          })
        )
      }

      const shopifyProductId = productSet.product!.id as ShopifyProductId

      yield* logInfo('Shopify client: product synced')
        .pipe(annotateLogs({ shopifyProductId }))

      return shopifyProductId
    }),

  archiveProduct: (shopifyProductId: ShopifyProductId): Effect<void, ShopifyClientError> =>
    gen(function* () {
      yield* logInfo('Shopify client: archiving product')
        .pipe(annotateLogs({ shopifyProductId }))

      yield* executeGraphQL<ProductSetMutationData>(
        config,
        tokenProvider,
        PRODUCT_ARCHIVE_MUTATION,
        { input: { id: shopifyProductId, status: 'ARCHIVED' } }
      )

      yield* logInfo('Shopify client: product archived')
        .pipe(annotateLogs({ shopifyProductId }))
    }),
})

// ============================================
// LAYER (depends on ShopifyConfig + ShopifyTokenProvider)
// ============================================

export const ShopifyClientLive = Layer.effect(
  ShopifyClient,
  gen(function* () {
    const config = yield* ShopifyConfig
    const tokenProvider = yield* ShopifyTokenProvider
    return createShopifyClient(config, tokenProvider)
  })
)
