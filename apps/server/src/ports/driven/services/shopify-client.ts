// src/ports/driven/services/shopify-client.ts

import { Context, Data, Effect } from 'effect'

import type { ShopifyProductId } from '../../../domain/pilot'
import type {
  ShopifyProductSetInput,
  ShopifyProductSetResponse,
} from '../../../application/shopify/dtos'

// ============================================
// SHOPIFY CLIENT ERROR
// ============================================

export class ShopifyClientError extends Data.TaggedError('ShopifyClientError')<{
  readonly operation: string
  readonly cause: unknown
}> {}

// ============================================
// SHOPIFY CLIENT
// ============================================

export interface ShopifyClientService {
  readonly productSet: (
    input: ShopifyProductSetInput
  ) => Effect.Effect<ShopifyProductSetResponse, ShopifyClientError>

  readonly productArchive: (productId: ShopifyProductId) => Effect.Effect<void, ShopifyClientError>
}

export class ShopifyClient extends Context.Tag('ShopifyClient')<
  ShopifyClient,
  ShopifyClientService
>() {}
