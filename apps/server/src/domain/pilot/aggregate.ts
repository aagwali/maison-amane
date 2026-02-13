// src/domain/pilot/aggregate.ts
//
// ============================================
// DDD: AGGREGATE ROOT
// ============================================
//
// The aggregate is the guardian of INVARIANTS - rules that must always be true
// for the entity to be in a valid state. Methods on the aggregate should:
//
//   1. Validate that the operation is allowed (guard/precondition)
//   2. Apply the change
//   3. Return the new state or fail with a domain error
//
// Invariants enforced:
//   - State transitions: DRAFT → PUBLISHED, DRAFT|PUBLISHED → ARCHIVED
//   - Cannot re-publish or un-archive
//   - Sync status managed through SyncStatusMachine (internal detail)
//
// ============================================

import { Data } from 'effect'
import { type Effect, fail, succeed } from 'effect/Effect'
import * as S from 'effect/Schema'

import { type CustomVariant, ProductVariantSchema, type StandardVariant } from './value-objects'
import {
  PriceRangeSchema,
  ProductCategorySchema,
  ProductStatus,
  ProductStatusSchema,
  ProductTypeSchema,
} from './enums'
import {
  ProductDescriptionSchema,
  ProductIdSchema,
  ProductLabelSchema,
  ProductViewsSchema,
  SyncStatusSchema,
  type ShopifyProductId,
  type SyncError,
} from './value-objects'
import { ArchiveNotAllowed, PublicationNotAllowed } from './errors'
import { SyncStatusMachine } from './services/sync-status.machine'

// ============================================
// VARIANT CONSTRUCTORS
// ============================================

export const makeStandardVariant = (params: Omit<StandardVariant, '_tag'>): StandardVariant =>
  Data.case<StandardVariant>()({ _tag: 'StandardVariant', ...params })

export const makeCustomVariant = (params: Omit<CustomVariant, '_tag'>): CustomVariant =>
  Data.case<CustomVariant>()({ _tag: 'CustomVariant', ...params })

// ============================================
// PILOT PRODUCT (Aggregate Root)
// ============================================

const VariantsNonEmptySchema = S.NonEmptyArray(ProductVariantSchema)

export const PilotProductSchema = S.TaggedStruct('PilotProduct', {
  id: ProductIdSchema,
  label: ProductLabelSchema,
  type: ProductTypeSchema,
  category: ProductCategorySchema,
  description: ProductDescriptionSchema,
  priceRange: PriceRangeSchema,
  variants: VariantsNonEmptySchema,
  views: ProductViewsSchema,
  status: ProductStatusSchema,
  syncStatus: SyncStatusSchema,
  createdAt: S.Date,
  updatedAt: S.Date,
})

export type PilotProduct = typeof PilotProductSchema.Type

export const makePilotProduct = (params: Omit<PilotProduct, '_tag'>): PilotProduct =>
  Data.case<PilotProduct>()({ _tag: 'PilotProduct', ...params })

// ============================================
// AGGREGATE METHODS
// ============================================
/**
 * Creates a new PilotProduct with updated fields.
 * Only the provided fields are updated; others remain unchanged.
 */
export const withUpdatedFields = (
  product: PilotProduct,
  updates: Partial<
    Pick<
      PilotProduct,
      'label' | 'type' | 'category' | 'description' | 'priceRange' | 'variants' | 'views'
    >
  >,
  updatedAt: Date
): PilotProduct =>
  makePilotProduct({
    ...product,
    ...updates,
    updatedAt,
  })

// ============================================
// STATE TRANSITIONS
// ============================================

export const publish = (
  product: PilotProduct,
  updatedAt: Date
): Effect<PilotProduct, PublicationNotAllowed> => {
  if (product.status === ProductStatus.ARCHIVED) {
    return fail(new PublicationNotAllowed({ reason: 'Cannot publish an archived product' }))
  }
  if (product.status === ProductStatus.PUBLISHED) {
    return fail(new PublicationNotAllowed({ reason: 'Product is already published' }))
  }
  return succeed(makePilotProduct({ ...product, status: ProductStatus.PUBLISHED, updatedAt }))
}

export const archive = (
  product: PilotProduct,
  updatedAt: Date
): Effect<PilotProduct, ArchiveNotAllowed> => {
  if (product.status === ProductStatus.ARCHIVED) {
    return fail(new ArchiveNotAllowed({ reason: 'Product is already archived' }))
  }
  return succeed(makePilotProduct({ ...product, status: ProductStatus.ARCHIVED, updatedAt }))
}

// ============================================
// SYNC STATUS METHODS
// ============================================

export const markSynced = (
  product: PilotProduct,
  shopifyProductId: ShopifyProductId,
  syncedAt: Date
): PilotProduct => {
  const newSyncStatus = SyncStatusMachine.markSynced(product.syncStatus, shopifyProductId, syncedAt)
  return makePilotProduct({ ...product, syncStatus: newSyncStatus, updatedAt: syncedAt })
}

export const markSyncFailed = (
  product: PilotProduct,
  error: SyncError,
  failedAt: Date
): PilotProduct => {
  const newSyncStatus = SyncStatusMachine.markFailed(product.syncStatus, error, failedAt)
  return makePilotProduct({ ...product, syncStatus: newSyncStatus, updatedAt: failedAt })
}

export const resetSyncStatus = (product: PilotProduct, updatedAt: Date): PilotProduct => {
  if (!SyncStatusMachine.canReset(product.syncStatus)) {
    return product
  }
  const newSyncStatus = SyncStatusMachine.reset(product.syncStatus)
  return makePilotProduct({ ...product, syncStatus: newSyncStatus, updatedAt })
}

// ============================================
// POLICIES (aggregate knowledge)
// ============================================

export const requiresChangeNotification = (product: PilotProduct): boolean =>
  product.status === ProductStatus.PUBLISHED || product.status === ProductStatus.ARCHIVED
