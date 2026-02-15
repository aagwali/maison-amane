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
export { structureViews, flattenViews, MIN_VIEWS } from './services'

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
  withUpdatedFields,
  publish,
  archive,
  markSynced,
  markSyncFailed,
  resetSyncStatus,
  requiresChangeNotification,
  type PilotProduct,
} from './aggregate'

// ============================================
// EVENTS
// ============================================
export {
  makePilotProductPublished,
  makePilotProductCreated,
  makePilotProductUpdated,
  type PilotProductPublished,
  type PilotProductCreated,
  type PilotProductUpdated,
  type PilotDomainEvent,
} from './events'

// ============================================
// ERRORS
// ============================================
export {
  ValidationError,
  ProductNotFoundError,
  PublicationNotAllowed,
  ArchiveNotAllowed,
  type PilotProductCreationError,
  type PilotProductUpdateError,
  type PilotProductQueryError,
} from './errors'
