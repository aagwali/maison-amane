// src/domain/pilot/value-objects/ids.ts

import * as S from "effect/Schema"

// ============================================
// PRODUCT ID
// ============================================

export const ProductIdSchema = S.String.pipe(S.brand("ProductId"))
export type ProductId = typeof ProductIdSchema.Type
export const MakeProductId = S.decodeUnknownSync(ProductIdSchema)

// ============================================
// VARIANT ID
// ============================================

export const VariantIdSchema = S.String.pipe(S.brand("VariantId"))
export type VariantId = typeof VariantIdSchema.Type
export const MakeVariantId = S.decodeUnknownSync(VariantIdSchema)

// ============================================
// SHOPIFY PRODUCT ID
// ============================================

export const ShopifyProductIdSchema = S.String.pipe(S.brand("ShopifyProductId"))
export type ShopifyProductId = typeof ShopifyProductIdSchema.Type
export const MakeShopifyProductId = S.decodeUnknownSync(ShopifyProductIdSchema)
