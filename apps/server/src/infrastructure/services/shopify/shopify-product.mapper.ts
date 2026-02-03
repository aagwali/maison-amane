// src/infrastructure/services/shopify/shopify-product.mapper.ts
//
// Anti-corruption layer: Maps domain PilotProduct to Shopify API format.
// This mapper lives in infrastructure because it translates domain language
// to an external system's language.

import {
  getDimensionsForSize,
  getPriceForVariant,
  type PilotProduct,
  type PredefinedSize,
  type ProductCategory,
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

const getVariantSizeLabel = (variant: ProductVariant, category: ProductCategory): string => {
  if (variant._tag === 'CustomVariant') {
    const { width, length } = variant.customDimensions
    return `${width}x${length}`
  }
  // Use reference data: take first dimension from the set
  const dimensions = getDimensionsForSize(category, variant.size as PredefinedSize)
  const firstDimension = dimensions[0]
  if (!firstDimension) {
    // Fallback if no dimension found (should not happen with valid data)
    return variant.size
  }
  return `${firstDimension.width}x${firstDimension.length}`
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
  const productType = `${product.type} - ${product.category}`
  const status: ShopifyProductStatus = 'ACTIVE'

  // Collect all unique size labels for product options
  const sizeLabels = product.variants.map((v) => getVariantSizeLabel(v, product.category))
  const uniqueSizeLabels = [...new Set(sizeLabels)]

  const productOptions: ShopifyProductOption[] = [
    {
      name: 'Dimensions',
      values: uniqueSizeLabels.map((name) => ({ name })),
    },
  ]

  // Map variants
  const variants: ShopifyVariantInput[] = product.variants.map((variant) => {
    const sizeLabel = getVariantSizeLabel(variant, product.category)
    const price = getPriceForVariant(variant, product.priceRange).toFixed(2)

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
    title: product.label,
    descriptionHtml: product.description,
    handle,
    productType,
    vendor: 'Maison Amane',
    status,
    tags: [product.priceRange, product.category],
    productOptions,
    variants,
    files,
  }
}
