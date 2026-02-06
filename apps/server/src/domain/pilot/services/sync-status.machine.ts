// src/domain/pilot/services/sync-status.machine.ts

import {
  makeNotSynced,
  makeSynced,
  makeSyncFailed,
  type NotSynced,
  type ShopifyProductId,
  type Synced,
  type SyncError,
  type SyncFailed,
  type SyncStatus,
} from '../value-objects'

// ============================================
// SYNC STATUS STATE MACHINE
// ============================================

export const SyncStatusMachine = {
  // Initial state
  initial: (): NotSynced => makeNotSynced(),

  // Transitions
  markSynced: (
    _current: NotSynced | SyncFailed | Synced,
    shopifyProductId: ShopifyProductId,
    syncedAt: Date
  ): Synced => makeSynced({ shopifyProductId, syncedAt }),

  markFailed: (
    current: NotSynced | SyncFailed | Synced,
    error: SyncError,
    failedAt: Date
  ): SyncFailed =>
    makeSyncFailed({
      error,
      failedAt,
      attempts: current._tag === 'SyncFailed' ? current.attempts + 1 : 1,
    }),

  reset: (_current: Synced | SyncFailed): NotSynced => makeNotSynced(),

  // Guards
  canSync: (status: SyncStatus): status is NotSynced | SyncFailed =>
    status._tag === 'NotSynced' || status._tag === 'SyncFailed',

  canReset: (status: SyncStatus): status is Synced | SyncFailed =>
    status._tag === 'Synced' || status._tag === 'SyncFailed',

  isSynced: (status: SyncStatus): status is Synced => status._tag === 'Synced',

  isFailed: (status: SyncStatus): status is SyncFailed => status._tag === 'SyncFailed',

  isNotSynced: (status: SyncStatus): status is NotSynced => status._tag === 'NotSynced',
}
