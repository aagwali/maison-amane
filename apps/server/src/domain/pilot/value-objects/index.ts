// src/domain/pilot/value-objects/index.ts

// ============================================
// IDS
// ============================================
export {
  ProductIdSchema,
  MakeProductId,
  type ProductId,
  ShopifyProductIdSchema,
  MakeShopifyProductId,
  type ShopifyProductId,
} from "./ids"

// ============================================
// SCALAR TYPES
// ============================================
export {
  ProductLabelSchema,
  MakeProductLabel,
  type ProductLabel,
  ProductDescriptionSchema,
  MakeProductDescription,
  type ProductDescription,
  PriceSchema,
  MakePrice,
  type Price,
  PositiveCmSchema,
  MakePositiveCm,
  type PositiveCm,
  ImageUrlSchema,
  MakeImageUrl,
  type ImageUrl,
} from "./scalar-types"

// ============================================
// DIMENSIONS
// ============================================
export {
  CustomDimensionSchema,
  type CustomDimension,
} from "./dimensions"

// ============================================
// VIEWS
// ============================================
export {
  ProductViewSchema,
  type ProductView,
  ProductViewsSchema,
  type ProductViews,
} from "./views"

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
} from "./variants"

// ============================================
// SYNC STATUS
// ============================================
export {
  SyncErrorSchema,
  type SyncError,
  MakeNotSynced,
  type NotSynced,
  MakeSynced,
  type Synced,
  MakeSyncFailed,
  type SyncFailed,
  SyncStatusSchema,
  type SyncStatus,
} from "./sync-status"
