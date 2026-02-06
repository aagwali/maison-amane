// src/domain/pilot/value-objects/index.ts

// ============================================
// IDS
// ============================================
export {
  ProductIdSchema,
  makeProductId,
  type ProductId,
  ShopifyProductIdSchema,
  makeShopifyProductId,
  type ShopifyProductId,
} from './ids'

// ============================================
// SCALAR TYPES
// ============================================
export {
  ProductLabelSchema,
  makeProductLabel,
  type ProductLabel,
  ProductDescriptionSchema,
  makeProductDescription,
  type ProductDescription,
  PriceSchema,
  makePrice,
  type Price,
  PositiveCmSchema,
  makePositiveCm,
  type PositiveCm,
  ImageUrlSchema,
  makeImageUrl,
  type ImageUrl,
} from './scalar-types'

// ============================================
// DIMENSIONS
// ============================================
export { CustomDimensionSchema, type CustomDimension } from './dimensions'

// ============================================
// VIEWS
// ============================================
export { ProductViewSchema, type ProductView, ProductViewsSchema, type ProductViews } from './views'

// ============================================
// VARIANTS (base schemas without id, for validation)
// ============================================
export {
  StandardVariantBaseSchema,
  CustomVariantBaseSchema,
  VariantBaseSchema,
  type StandardVariantBase,
  type CustomVariantBase,
  type VariantBase,
  // Aliases for aggregate usage
  ProductVariantSchema,
  StandardVariantSchema,
  CustomVariantSchema,
  type ProductVariant,
  type StandardVariant,
  type CustomVariant,
} from './variants'

// ============================================
// SYNC STATUS
// ============================================
export {
  SyncErrorSchema,
  type SyncError,
  makeNotSynced,
  type NotSynced,
  makeSynced,
  type Synced,
  makeSyncFailed,
  type SyncFailed,
  SyncStatusSchema,
  type SyncStatus,
} from './sync-status'
