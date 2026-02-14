import { Data } from 'effect'

import type { ProductId } from '../../../domain/pilot'

// ============================================
// GET PILOT PRODUCT QUERY
// ============================================

const GetPilotProductQuery = Data.case<{
  readonly _tag: 'GetPilotProductQuery'
  readonly productId: ProductId
}>()

export type GetPilotProductQuery = ReturnType<typeof GetPilotProductQuery>

export const makeGetPilotProductQuery = (productId: ProductId): GetPilotProductQuery =>
  GetPilotProductQuery({ _tag: 'GetPilotProductQuery', productId })
