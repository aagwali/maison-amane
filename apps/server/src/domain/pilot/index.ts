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
  // Scalar Types
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
  // Variants (base, without id)
  VariantBaseSchema,
  type VariantBase,
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
// SERVICES
// ============================================
export {
  SyncStatusMachine,
  structureViews,
  flattenViews,
  MIN_VIEWS,
} from "./services"

// ============================================
// ENTITIES
// ============================================
export {
  StandardVariantSchema,
  type StandardVariant,
  CustomVariantSchema,
  type CustomVariant,
  ProductVariantSchema,
  type ProductVariant,
} from "./entities"

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
  ProductTypeSchema,
  ProductCategorySchema,
  SizeSchema,
  PriceRangeSchema,
  ProductStatusSchema,
  ViewTypeSchema,
  type PredefinedSize,
} from "./enums"

// ============================================
// REFERENCE DATA
// ============================================
export {
  DIMENSION_SETS,
  getDimensionsForSize,
  type Dimension,
} from "./reference-data"

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
  type PilotProductCreationError,
} from "./errors"
