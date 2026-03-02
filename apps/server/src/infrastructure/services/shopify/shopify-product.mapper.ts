// src/infrastructure/services/shopify/shopify-product.mapper.ts
//
// Anti-corruption layer: Maps domain PilotProduct to Shopify API format.
// This mapper lives in infrastructure because it translates domain language
// to an external system's language.

import {
  calculateVariantPrice,
  DIMENSION_SETS,
  type PilotProduct,
  type PredefinedSize,
  type ProductVariant,
} from '../../../domain/pilot'

import type {
  ShopifyFileInput,
  ShopifyOptionValue,
  ShopifyProductOption,
  ShopifyProductSetInput,
  ShopifyProductStatus,
  ShopifyVariantInput,
} from './dtos'

// ============================================
// SIZE/DIMENSION MAPPING
// ============================================

const getVariantSizeLabel = (variant: ProductVariant, shape: PilotProduct['shape']): string => {
  const sizeSpec = variant.sizeSpec
  if (sizeSpec._tag === 'BespokeSize') {
    return `${sizeSpec.width}x${sizeSpec.length}`
  }
  // CatalogSize — scalaire dans DIMENSION_SETS
  const dim = DIMENSION_SETS[shape][sizeSpec.size as PredefinedSize]
  return `${dim?.width}x${dim?.length}`
}

// ============================================
// HANDLE GENERATION
// ============================================

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

// ============================================
// MAPPER: PilotProduct → ShopifyProductSetInput
// ============================================

export const mapToShopifyProduct = (product: PilotProduct): ShopifyProductSetInput => {
  const handle = slugify(product.label)
  const productType = `${product.type} - ${product.shape}`
  const status: ShopifyProductStatus = 'DRAFT'

  // If already synced, include Shopify GID so productSet does an update
  const id = product.syncStatus._tag === 'Synced' ? product.syncStatus.shopifyProductId : undefined

  // Collect all unique size labels for product options
  const sizeLabels = product.variants.map((v) => getVariantSizeLabel(v, product.shape))
  const uniqueSizeLabels = [...new Set(sizeLabels)]

  const productOptions: ShopifyProductOption[] = [
    {
      name: 'Dimensions',
      values: uniqueSizeLabels.map((name) => ({ name })),
    },
  ]

  // Map variants — prix calculé selon sizeSpec + material
  const variants: ShopifyVariantInput[] = product.variants.map((variant) => {
    const sizeLabel = getVariantSizeLabel(variant, product.shape)

    const priceInCentimes =
      variant.pricingSpec._tag === 'NegotiatedPrice'
        ? variant.pricingSpec.amount
        : calculateVariantPrice(variant.sizeSpec, product.shape, product.material)

    const price = (priceInCentimes / 100).toFixed(2)

    const optionValues: ShopifyOptionValue[] = [{ optionName: 'Dimensions', name: sizeLabel }]

    return { optionValues, price }
  })

  // Map images (all views)
  const files: ShopifyFileInput[] = [
    { originalSource: product.views.front.imageUrl, contentType: 'IMAGE' },
    { originalSource: product.views.detail.imageUrl, contentType: 'IMAGE' },
    ...product.views.additional.map((view) => ({
      originalSource: view.imageUrl,
      contentType: 'IMAGE' as const,
    })),
  ]

  return {
    id,
    title: product.label,
    descriptionHtml: product.description,
    handle,
    productType,
    vendor: 'Maison Amane',
    status,
    tags: [product.material.toLowerCase(), product.shape.toLowerCase()],
    productOptions,
    variants,
    files,
  }
}
