// src/domain/pilot/index.ts

// ============================================
// VALUE OBJECTS
// ============================================
export {
  // IDs
  ProductIdSchema,
  makeProductId,
  type ProductId,
  ShopifyProductIdSchema,
  makeShopifyProductId,
  type ShopifyProductId,
  // Scalar Types
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
  // Dimensions
  CustomDimensionSchema,
  type CustomDimension,
  // Views
  ProductViewSchema,
  type ProductView,
  ProductViewsSchema,
  type ProductViews,
  // Variants (value objects)
  VariantBaseSchema,
  type VariantBase,
  // Sync Status
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
} from './value-objects'

// ============================================
// SERVICES
// ============================================
export { SyncStatusMachine, structureViews, flattenViews, MIN_VIEWS } from './services'

// ============================================
// VARIANTS (value objects)
// ============================================
export {
  StandardVariantSchema,
  type StandardVariant,
  CustomVariantSchema,
  type CustomVariant,
  ProductVariantSchema,
  type ProductVariant,
} from './value-objects'

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
} from './enums'

// ============================================
// REFERENCE DATA
// ============================================
export {
  DIMENSION_SETS,
  getDimensionsForSize,
  PRICE_BY_RANGE,
  getPriceForVariant,
  type Dimension,
} from './reference-data'

// ============================================
// AGGREGATE
// ============================================
export {
  makeStandardVariant,
  makePilotProduct,
  makeCustomVariant,
  withSyncStatus,
  withUpdatedFields,
  type PilotProduct,
} from './aggregate'

// ============================================
// EVENTS
// ============================================
export {
  makePilotProductPublished,
  makePilotProductUpdated,
  type PilotProductPublished,
  type PilotProductUpdated,
  type PilotDomainEvent,
} from './events'

// ============================================
// ERRORS
// ============================================
export {
  ValidationError,
  ProductNotFoundError,
  type PilotProductCreationError,
  type PilotProductUpdateError,
} from './errors'

// ============================================
// POLICIES
// ============================================
// export { canSyncProduct, SyncNotAllowed } from "./policies"
export { canPublish, PublicationNotAllowed, requiresChangeNotification } from './policies'
