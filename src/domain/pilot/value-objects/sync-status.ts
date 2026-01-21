// src/domain/pilot/value-objects/sync-status.ts

import * as S from "effect/Schema"
import { case as constructor } from "effect/Data"
import { TaggedSchema } from "../../shared"
import { ShopifyProductIdSchema } from "./ids"

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

const NotSyncedSchema = TaggedSchema("NotSynced", {})

export type NotSynced = typeof NotSyncedSchema.Type

export const MakeNotSynced = constructor<NotSynced>()

// ============================================
// SYNCED
// ============================================

const SyncedSchema = TaggedSchema("Synced", {
  shopifyProductId: ShopifyProductIdSchema,
  syncedAt: S.Date,
})

export type Synced = typeof SyncedSchema.Type

export const MakeSynced = constructor<Synced>()

// ============================================
// SYNC FAILED
// ============================================

const SyncFailedSchema = TaggedSchema("SyncFailed", {
  error: SyncErrorSchema,
  failedAt: S.Date,
  attempts: S.Number,
})

export type SyncFailed = typeof SyncFailedSchema.Type

export const MakeSyncFailed = constructor<SyncFailed>()

// ============================================
// SYNC STATUS (union)
// ============================================

export const SyncStatusSchema = S.Union(NotSyncedSchema, SyncedSchema, SyncFailedSchema)

export type SyncStatus = typeof SyncStatusSchema.Type
