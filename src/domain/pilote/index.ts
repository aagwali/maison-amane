// src/domain/pilote/index.ts

// ============================================
// VALUE OBJECTS
// ============================================
export {
  // Schemas
  ProductIdSchema,
  VariantIdSchema,
  ShopifyProductIdSchema,
  CorrelationIdSchema,
  UserIdSchema,
  ProductLabelSchema,
  ProductDescriptionSchema,
  PriceSchema,
  PositiveCmSchema,
  ImageUrlSchema,
  // Types
  type ProductId,
  type VariantId,
  type ShopifyProductId,
  type CorrelationId,
  type UserId,
  type ProductLabel,
  type ProductDescription,
  type Price,
  type PositiveCm,
  type ImageUrl,
  // Constructors
  MakeProductId,
  MakeVariantId,
  MakeShopifyProductId,
  MakeCorrelationId,
  MakeUserId,
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
// COMMANDS
// ============================================
export {
  PilotProductCommand,
  type UnvalidatedProductData,
  type UnvalidatedVariant,
  type UnvalidatedView
} from "./commands"

// ============================================
// EVENTS
// ============================================
export { PilotProductCreated } from "./events"

// ============================================
// ERRORS
// ============================================
export {
  ValidationError,
  PersistenceError,
  type CreateProductError
} from "./errors"

// ============================================
// PORTS
// ============================================
export {
  ProductRepository,
  IdGenerator,
  EventPublisher,
  Clock
} from "./ports"

// ============================================
// WORKFLOW
// ============================================
export { createPilotProduct } from "./workflow"

// ============================================
// VALIDATION
// ============================================
export {
  validateProductData,
  type ValidatedProductData,
  type ValidatedVariant
} from "./validation"
