// src/domain/pilot/services/views.service.ts

import { ViewType } from '../enums'
import type { ProductView, ProductViews } from '../value-objects'

// ============================================
// CONSTRAINTS
// ============================================

export const MIN_VIEWS = 2

// ============================================
// VIEWS TRANSFORMATIONS
// ============================================

export const structureViews = (views: readonly ProductView[]): ProductViews => {
  const front = views.find((v) => v.viewType === ViewType.FRONT)!
  const detail = views.find((v) => v.viewType === ViewType.DETAIL)!
  const additional = views.filter(
    (v) => v.viewType !== ViewType.FRONT && v.viewType !== ViewType.DETAIL
  )
  return { front, detail, additional }
}

export const flattenViews = (pv: ProductViews): readonly ProductView[] => [
  pv.front,
  pv.detail,
  ...pv.additional,
]
