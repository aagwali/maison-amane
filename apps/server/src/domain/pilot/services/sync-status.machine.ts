// src/domain/pilot/services/sync-status.machine.ts

import {
  type SyncStatus,
  type SyncError,
  type NotSynced,
  type Synced,
  type SyncFailed,
  type ShopifyProductId,
  MakeNotSynced,
} from "../value-objects"

// ============================================
// SYNC STATUS STATE MACHINE
// ============================================

export const SyncStatusMachine = {
  // Initial state
  initial: MakeNotSynced,

  // Transitions
  markSynced: (
    _current: NotSynced | SyncFailed,
    shopifyProductId: ShopifyProductId,
    syncedAt: Date
  ): Synced => ({
    _tag: "Synced",
    shopifyProductId,
    syncedAt,
  }),

  markFailed: (
    current: NotSynced | SyncFailed,
    error: SyncError,
    failedAt: Date
  ): SyncFailed => ({
    _tag: "SyncFailed",
    error,
    failedAt,
    attempts: current._tag === "SyncFailed" ? current.attempts + 1 : 1,
  }),

  reset: (_current: Synced | SyncFailed): NotSynced => ({
    _tag: "NotSynced",
  }),

  // Guards
  canSync: (status: SyncStatus): status is NotSynced | SyncFailed =>
    status._tag === "NotSynced" || status._tag === "SyncFailed",

  canReset: (status: SyncStatus): status is Synced | SyncFailed =>
    status._tag === "Synced" || status._tag === "SyncFailed",

  isSynced: (status: SyncStatus): status is Synced =>
    status._tag === "Synced",

  isFailed: (status: SyncStatus): status is SyncFailed =>
    status._tag === "SyncFailed",

  isNotSynced: (status: SyncStatus): status is NotSynced =>
    status._tag === "NotSynced",
}
