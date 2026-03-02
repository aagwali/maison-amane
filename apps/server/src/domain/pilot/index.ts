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
export { structureViews, flattenViews, MIN_VIEWS, calculateVariantPrice } from './services'

// ============================================
// VARIANTS (value objects)
// ============================================
export {
  CatalogSizeSchema,
  type CatalogSize,
  BespokeSizeSchema,
  type BespokeSize,
  VariantSizeSchema,
  type VariantSize,
  FormulaPricingSchema,
  type FormulaPricing,
  NegotiatedPricingSchema,
  type NegotiatedPricing,
  VariantPricingSchema,
  type VariantPricing,
  ProductVariantSchema,
  type ProductVariant,
} from './value-objects'

// ============================================
// ENUMS
// ============================================
export {
  ProductType,
  ProductShape,
  Material,
  Size,
  ProductStatus,
  ViewType,
  REQUIRED_VIEW_TYPES,
  ProductTypeSchema,
  ProductShapeSchema,
  MaterialSchema,
  SizeSchema,
  ProductStatusSchema,
  ViewTypeSchema,
  type PredefinedSize,
  type ProductShapeType,
  type MaterialType,
} from './enums'

// ============================================
// REFERENCE DATA
// ============================================
export { DIMENSION_SETS, PRICE_PER_SQM, type Dimension } from './reference-data'

// ============================================
// AGGREGATE
// ============================================
export {
  makePilotProduct,
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
  type PilotProductListError,
} from './errors'
