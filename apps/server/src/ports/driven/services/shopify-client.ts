// src/ports/driven/services/shopify-client.ts
//
// Port for Shopify integration.
// Speaks in domain terms (PilotProduct, ShopifyProductId).
// The adapter handles the translation to Shopify's API format.

import { Context, Data } from 'effect'
import type { Effect } from 'effect/Effect'

import type { PilotProduct, ShopifyProductId } from '../../../domain/pilot'

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

/**
 * Port for Shopify product synchronization.
 *
 * This interface speaks in domain terms:
 * - Input: PilotProduct (domain aggregate)
 * - Output: ShopifyProductId (domain value object)
 *
 * The adapter implementation handles:
 * - Mapping domain → Shopify API format
 * - API calls
 * - Error handling
 */
export interface ShopifyClientService {
  readonly syncProduct: (product: PilotProduct) => Effect<ShopifyProductId, ShopifyClientError>

  readonly archiveProduct: (shopifyProductId: ShopifyProductId) => Effect<void, ShopifyClientError>
}

export class ShopifyClient extends Context.Tag('ShopifyClient')<
  ShopifyClient,
  ShopifyClientService
>() {}
