// packages/shared-kernel/src/domain/value-objects/index.ts

export { CorrelationIdSchema, MakeCorrelationId, type CorrelationId } from './correlation-id'

export { UserIdSchema, MakeUserId, type UserId } from './user-id'

export { ProductIdSchema, MakeProductId, type ProductId } from './product-id'

export {
  ProductCategory,
  ProductCategorySchema,
  MakeProductCategory,
  PriceRange,
  PriceRangeSchema,
  MakePriceRange,
  Size,
  SizeSchema,
  MakeSize,
} from './product-enums'
