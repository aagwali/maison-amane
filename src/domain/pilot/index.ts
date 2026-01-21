// src/domain/pilot/index.ts

// ============================================
// VALUE OBJECTS
// ============================================
export {
  // IDs
  ProductIdSchema,
  MakeProductId,
  type ProductId,
  VariantIdSchema,
  MakeVariantId,
  type VariantId,
  ShopifyProductIdSchema,
  MakeShopifyProductId,
  type ShopifyProductId,
  // Primitives
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
  // Dimensions
  CustomDimensionSchema,
  type CustomDimension,
  // Views
  ProductViewSchema,
  type ProductView,
  ProductViewsSchema,
  type ProductViews,
  // Variants (entities)
  StandardVariantSchema,
  type StandardVariant,
  CustomVariantSchema,
  type CustomVariant,
  ProductVariantSchema,
  type ProductVariant,
  // Sync Status
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
} from "./value-objects"

// ============================================
// ENUMS
// ============================================
export {
  ProductType,
  ProductCategory,
  Size,
  PriceRange,
  ProductStatus,
  ViewType,
  REQUIRED_VIEW_TYPES,
  MIN_VIEWS,
  DIMENSION_SETS,
  getDimensionsForSize,
  ProductTypeSchema,
  ProductCategorySchema,
  SizeSchema,
  PriceRangeSchema,
  ProductStatusSchema,
  ViewTypeSchema,
  type PredefinedSize,
  type Dimension,
} from "./enums"

// ============================================
// AGGREGATE
// ============================================
export {
  MakeStandardVariant,
  MakePilotProduct,
  MakeCustomVariant,
  type PilotProduct,
} from "./aggregate"

// ============================================
// EVENTS
// ============================================
export {
  MakePilotProductPublished,
  type PilotProductPublished,
  type PilotDomainEvent,
} from "./events"

// ============================================
// ERRORS
// ============================================
export {
  ValidationError,
  MakePersistenceError,
  type PersistenceError,
  type CreateProductError,
} from "./errors"
