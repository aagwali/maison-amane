// packages/shared-kernel/src/infrastructure/config/shopify.config.ts

import { Config, Context, Layer, Redacted } from 'effect'
import { withDefault } from 'effect/Config'

// ============================================
// SHOPIFY CONFIGURATION
// ============================================

export interface ShopifyConfigValue {
  readonly storeUrl: string
  readonly clientId: string
  readonly clientSecret: Redacted.Redacted<string>
  readonly apiVersion: string
}

export class ShopifyConfig extends Context.Tag('ShopifyConfig')<
  ShopifyConfig,
  ShopifyConfigValue
>() {}

export const shopifyConfigFromEnv = Config.all({
  storeUrl: Config.string('SHOPIFY_STORE_URL'),
  clientId: Config.string('SHOPIFY_CLIENT_ID'),
  clientSecret: Config.redacted('SHOPIFY_CLIENT_SECRET'),
  apiVersion: Config.string('SHOPIFY_API_VERSION')
    .pipe(withDefault('2025-01')),
})

export const ShopifyConfigLive = Layer.effect(ShopifyConfig, shopifyConfigFromEnv)
