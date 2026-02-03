// src/infrastructure/services/shopify/index.ts

export { FakeShopifyClientLive } from './fake-shopify-client'
export { mapToShopifyProduct } from './shopify-product.mapper'
export type {
  ShopifyProductSetInput,
  ShopifyProductSetResponse,
  ShopifyProductStatus,
} from './shopify-api.types'
