import { Data } from 'effect'

// ============================================
// LIST PILOT PRODUCTS QUERY
// ============================================

const ListPilotProductsQuery = Data.case<{
  readonly _tag: 'ListPilotProductsQuery'
}>()

export type ListPilotProductsQuery = ReturnType<typeof ListPilotProductsQuery>

export const makeListPilotProductsQuery = (): ListPilotProductsQuery =>
  ListPilotProductsQuery({ _tag: 'ListPilotProductsQuery' })
