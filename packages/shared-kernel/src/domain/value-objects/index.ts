// packages/shared-kernel/src/domain/value-objects/index.ts

export { CorrelationIdSchema, makeCorrelationId, type CorrelationId } from './correlation-id'

export { UserIdSchema, makeUserId, type UserId } from './user-id'

export { ProductIdSchema, makeProductId, type ProductId } from './product-id'

export { MediaIdSchema, makeMediaId, type MediaId } from './media-id'

export {
  ProductShape,
  ProductShapeSchema,
  makeProductShape,
  Material,
  MaterialSchema,
  makeMaterial,
  Size,
  SizeSchema,
  makeSize,
} from './product-enums'
