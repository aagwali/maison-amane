// src/application/shopify/dtos/shopify-product.dto.ts
//
// Shopify GraphQL Admin API - productSet mutation input
// Based on: https://shopify.dev/docs/api/admin-graphql/latest/mutations/productSet

// ============================================
// SHOPIFY PRODUCT OPTION VALUE
// ============================================

export interface ShopifyOptionValue {
  readonly optionName: string
  readonly name: string
}

// ============================================
// SHOPIFY FILE INPUT (for images)
// ============================================

export interface ShopifyFileInput {
  readonly originalSource: string
  readonly contentType?: "IMAGE"
}

// ============================================
// SHOPIFY VARIANT INPUT
// ============================================

export interface ShopifyVariantInput {
  readonly optionValues: readonly ShopifyOptionValue[]
  readonly price: string
}

// ============================================
// SHOPIFY PRODUCT OPTION
// ============================================

export interface ShopifyProductOption {
  readonly name: string
  readonly values: readonly { readonly name: string }[]
}

// ============================================
// SHOPIFY PRODUCT SET INPUT
// ============================================

export type ShopifyProductStatus = "ACTIVE" | "DRAFT" | "ARCHIVED"

export interface ShopifyProductSetInput {
  readonly title: string
  readonly descriptionHtml: string
  readonly handle: string
  readonly productType: string
  readonly vendor: string
  readonly status: ShopifyProductStatus
  readonly tags: readonly string[]
  readonly productOptions: readonly ShopifyProductOption[]
  readonly variants: readonly ShopifyVariantInput[]
  readonly files: readonly ShopifyFileInput[]
}

// ============================================
// SHOPIFY PRODUCT SET RESPONSE
// ============================================

export interface ShopifyProductSetResponse {
  readonly product: {
    readonly id: string
  } | null
  readonly userErrors: readonly {
    readonly field: readonly string[]
    readonly message: string
  }[]
}
