// src/application/shopify/mappers/shopify-product.mapper.ts
//
// Maps PilotProduct to Shopify ProductSetInput

import {
  getDimensionsForSize,
  PriceRange,
  Size,
  type PredefinedSize,
  type ProductCategory,
} from '../../../domain/pilot'

import type { PilotProduct, ProductVariant } from "../../../domain/pilot"
import type {
  ShopifyFileInput,
  ShopifyOptionValue,
  ShopifyProductOption,
  ShopifyProductSetInput,
  ShopifyProductStatus,
  ShopifyVariantInput,
} from "../dtos"

// ============================================
// PRICE MAPPING
// ============================================

// NOTE: These are placeholder prices based on priceRange.
// TODO: Replace with actual pricing logic (size-based calculation)
const PRICE_BY_RANGE: Record<PriceRange, Record<Size, number>> = {
  [PriceRange.DISCOUNT]: {
    [Size.REGULAR]: 400,
    [Size.LARGE]: 600,
    [Size.CUSTOM]: 500, // Default for custom, overridden by actual price
  },
  [PriceRange.STANDARD]: {
    [Size.REGULAR]: 600,
    [Size.LARGE]: 900,
    [Size.CUSTOM]: 800,
  },
  [PriceRange.PREMIUM]: {
    [Size.REGULAR]: 900,
    [Size.LARGE]: 1400,
    [Size.CUSTOM]: 1200,
  },
}

const getVariantPrice = (
  variant: ProductVariant,
  priceRange: PriceRange
): string => {
  if (variant._tag === "CustomVariant") {
    // Custom variants have their own price
    return variant.price.toFixed(2)
  }
  // Standard variants use priceRange + size lookup
  const price = PRICE_BY_RANGE[priceRange][variant.size]
  return price.toFixed(2)
}

// ============================================
// SIZE/DIMENSION MAPPING
// ============================================

const getVariantSizeLabel = (
  variant: ProductVariant,
  category: ProductCategory
): string => {
  if (variant._tag === "CustomVariant") {
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
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

// ============================================
// MAPPER: PilotProduct → ShopifyProductSetInput
// ============================================

export const mapToShopifyProduct = (
  product: PilotProduct
): ShopifyProductSetInput => {
  const handle = slugify(product.label)
  const productType = `${product.type} - ${product.category}`
  const status: ShopifyProductStatus = "ACTIVE"

  // Collect all unique size labels for product options
  const sizeLabels = product.variants.map((v) => getVariantSizeLabel(v, product.category))
  const uniqueSizeLabels = [...new Set(sizeLabels)]

  const productOptions: ShopifyProductOption[] = [
    {
      name: "Dimensions",
      values: uniqueSizeLabels.map((name) => ({ name })),
    },
  ]

  // Map variants
  const variants: ShopifyVariantInput[] = product.variants.map((variant) => {
    const sizeLabel = getVariantSizeLabel(variant, product.category)
    const price = getVariantPrice(variant, product.priceRange)

    const optionValues: ShopifyOptionValue[] = [
      { optionName: "Dimensions", name: sizeLabel },
    ]

    return { optionValues, price }
  })

  // Map images (all views)
  const files: ShopifyFileInput[] = [
    { originalSource: product.views.front.imageUrl, contentType: "IMAGE" },
    { originalSource: product.views.detail.imageUrl, contentType: "IMAGE" },
    ...product.views.additional.map((view) => ({
      originalSource: view.imageUrl,
      contentType: "IMAGE" as const,
    })),
  ]

  return {
    title: product.label,
    descriptionHtml: product.description,
    handle,
    productType,
    vendor: "Maison Amane",
    status,
    tags: [product.priceRange, product.category],
    productOptions,
    variants,
    files,
  }
}
