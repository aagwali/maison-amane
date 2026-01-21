// src/domain/pilot/index.ts

// ============================================
// VALUE OBJECTS
// ============================================
export {
  // Schemas
  ProductIdSchema,
  VariantIdSchema,
  ShopifyProductIdSchema,
  ProductLabelSchema,
  ProductDescriptionSchema,
  PriceSchema,
  PositiveCmSchema,
  ImageUrlSchema,
  ProductViewSchema,
  CustomDimensionSchema,
  ValidatedVariantSchema,
  ProductVariantSchema,
  StandardVariantSchema,
  CustomVariantSchema,
  // Types
  type ProductId,
  type VariantId,
  type ShopifyProductId,
  type ProductLabel,
  type ProductDescription,
  type Price,
  type PositiveCm,
  type ImageUrl,
  type ValidatedVariant,
  type ValidatedStandardVariant,
  type ValidatedCustomVariant,
  // Constructors
  MakeProductId,
  MakeVariantId,
  MakeShopifyProductId,
  MakeProductLabel,
  MakeProductDescription,
  MakePrice,
  MakePositiveCm,
  MakeImageUrl,
  // Other
  SyncStatus,
  type CustomDimension,
  type ProductView,
  type ProductViews,
  type SyncError,
  type NotSynced,
  type Synced,
  type SyncFailed
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
  type Dimension
} from "./enums"

// ============================================
// AGGREGATE
// ============================================
export {
  PilotProductAggregate,
  ProductVariantEntity,
  type PilotProduct,
  type StandardVariant,
  type CustomVariant,
  type ProductVariant
} from "./aggregate"

// ============================================
// EVENTS
// ============================================
export {
  PilotProductPublished,
  type PilotDomainEvent
} from "./events"

// ============================================
// ERRORS
// ============================================
export {
  ValidationError,
  PersistenceError,
  type CreateProductError
} from "./errors"
