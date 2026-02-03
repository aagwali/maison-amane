// src/domain/pilot/value-objects/ids.ts

import * as S from 'effect/Schema'

// ============================================
// PRODUCT ID (re-exported from shared-kernel)
// ============================================

export { ProductIdSchema, MakeProductId, type ProductId } from '@maison-amane/shared-kernel'

// ============================================
// SHOPIFY PRODUCT ID (Pilot-specific)
// ============================================

export const ShopifyProductIdSchema = S.String.pipe(S.brand('ShopifyProductId'))
export type ShopifyProductId = typeof ShopifyProductIdSchema.Type
export const MakeShopifyProductId = S.decodeUnknownSync(ShopifyProductIdSchema)
