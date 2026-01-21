// src/domain/pilot/value-objects/index.ts

// ============================================
// IDS
// ============================================
export {
  ProductIdSchema,
  MakeProductId,
  type ProductId,
  VariantIdSchema,
  MakeVariantId,
  type VariantId,
  ShopifyProductIdSchema,
  MakeShopifyProductId,
  type ShopifyProductId,
} from "./ids"

// ============================================
// PRIMITIVES
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
} from "./primitives"

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
// VARIANTS (entities with id)
// ============================================
export {
  StandardVariantSchema,
  type StandardVariant,
  CustomVariantSchema,
  type CustomVariant,
  ProductVariantSchema,
  type ProductVariant,
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
