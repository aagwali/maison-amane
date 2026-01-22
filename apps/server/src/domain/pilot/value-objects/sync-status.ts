// src/domain/pilot/value-objects/sync-status.ts

import * as S from "effect/Schema"
import { ShopifyProductIdSchema, type ShopifyProductId } from "./ids"

// ============================================
// SYNC ERROR
// ============================================

export const SyncErrorSchema = S.Struct({
  code: S.String,
  message: S.String,
  details: S.Unknown,
})

export type SyncError = typeof SyncErrorSchema.Type

// ============================================
// NOT SYNCED
// ============================================

const NotSyncedSchema = S.TaggedStruct("NotSynced", {})

export type NotSynced = typeof NotSyncedSchema.Type

// ============================================
// SYNCED
// ============================================

const SyncedSchema = S.TaggedStruct("Synced", {
  shopifyProductId: ShopifyProductIdSchema,
  syncedAt: S.Date,
})

export type Synced = typeof SyncedSchema.Type

// ============================================
// SYNC FAILED
// ============================================

const SyncFailedSchema = S.TaggedStruct("SyncFailed", {
  error: SyncErrorSchema,
  failedAt: S.Date,
  attempts: S.Number,
})

export type SyncFailed = typeof SyncFailedSchema.Type

// ============================================
// SYNC STATUS (union)
// ============================================

export const SyncStatusSchema = S.Union(NotSyncedSchema, SyncedSchema, SyncFailedSchema)

export type SyncStatus = typeof SyncStatusSchema.Type

// ============================================
// FACTORIES
// ============================================

export const MakeNotSynced = (): NotSynced => ({ _tag: "NotSynced" })

export const MakeSynced = (params: {
  shopifyProductId: ShopifyProductId
  syncedAt: Date
}): Synced => ({
  _tag: "Synced",
  ...params,
})

export const MakeSyncFailed = (params: {
  error: SyncError
  failedAt: Date
  attempts: number
}): SyncFailed => ({
  _tag: "SyncFailed",
  ...params,
})
