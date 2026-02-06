// packages/shared-kernel/src/domain/value-objects/index.ts

export { CorrelationIdSchema, makeCorrelationId, type CorrelationId } from './correlation-id'

export { UserIdSchema, makeUserId, type UserId } from './user-id'

export { ProductIdSchema, makeProductId, type ProductId } from './product-id'

export {
  ProductCategory,
  ProductCategorySchema,
  makeProductCategory,
  PriceRange,
  PriceRangeSchema,
  makePriceRange,
  Size,
  SizeSchema,
  makeSize,
} from './product-enums'
