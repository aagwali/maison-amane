// packages/shared-kernel/src/domain/events/product-id.ts

import * as S from 'effect/Schema'

export const ProductIdSchema = S.String.pipe(S.brand('ProductId'))
export type ProductId = typeof ProductIdSchema.Type
export const MakeProductId = S.decodeUnknownSync(ProductIdSchema)
