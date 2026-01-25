// src/domain/pilot/services/sync-status.machine.test.ts
//
// UNIT TESTS: Pure functions, no Effect Layer needed.
// Tests the SyncStatus state machine transitions and guards.

import { describe, expect, it } from 'vitest'

import {
  MakeNotSynced,
  MakeShopifyProductId,
  MakeSynced,
  MakeSyncFailed,
  type SyncError,
} from '../value-objects'
import { SyncStatusMachine } from './sync-status.machine'

// ============================================
// TEST FIXTURES
// ============================================

const shopifyId = MakeShopifyProductId("shopify-123")
const syncDate = new Date("2024-01-15T10:00:00Z")
const failDate = new Date("2024-01-15T11:00:00Z")

const syncError: SyncError = {
  code: "SHOPIFY_API_ERROR",
  message: "Rate limit exceeded",
  details: { retryAfter: 60 },
}

// ============================================
// INITIAL STATE
// ============================================

describe("SyncStatusMachine.initial", () => {
  it("returns NotSynced state", () => {
    const initial = SyncStatusMachine.initial()

    expect(initial._tag).toBe("NotSynced")
  })
})

// ============================================
// TRANSITIONS
// ============================================

describe("SyncStatusMachine.markSynced", () => {
  it("transitions from NotSynced to Synced", () => {
    const notSynced = MakeNotSynced()

    const synced = SyncStatusMachine.markSynced(notSynced, shopifyId, syncDate)

    expect(synced._tag).toBe("Synced")
    expect(synced.shopifyProductId).toBe(shopifyId)
    expect(synced.syncedAt).toEqual(syncDate)
  })

  it("transitions from SyncFailed to Synced", () => {
    const failed = MakeSyncFailed({ error: syncError, failedAt: failDate, attempts: 2 })

    const synced = SyncStatusMachine.markSynced(failed, shopifyId, syncDate)

    expect(synced._tag).toBe("Synced")
    expect(synced.shopifyProductId).toBe(shopifyId)
  })
})

describe("SyncStatusMachine.markFailed", () => {
  it("transitions from NotSynced to SyncFailed with attempts = 1", () => {
    const notSynced = MakeNotSynced()

    const failed = SyncStatusMachine.markFailed(notSynced, syncError, failDate)

    expect(failed._tag).toBe("SyncFailed")
    expect(failed.error).toEqual(syncError)
    expect(failed.failedAt).toEqual(failDate)
    expect(failed.attempts).toBe(1)
  })

  it("increments attempts when transitioning from SyncFailed", () => {
    const previousFailed = MakeSyncFailed({
      error: syncError,
      failedAt: failDate,
      attempts: 3,
    })

    const failed = SyncStatusMachine.markFailed(
      previousFailed,
      syncError,
      new Date("2024-01-15T12:00:00Z")
    )

    expect(failed.attempts).toBe(4)
  })
})

describe("SyncStatusMachine.reset", () => {
  it("transitions from Synced to NotSynced", () => {
    const synced = MakeSynced({ shopifyProductId: shopifyId, syncedAt: syncDate })

    const reset = SyncStatusMachine.reset(synced)

    expect(reset._tag).toBe("NotSynced")
  })

  it("transitions from SyncFailed to NotSynced", () => {
    const failed = MakeSyncFailed({ error: syncError, failedAt: failDate, attempts: 5 })

    const reset = SyncStatusMachine.reset(failed)

    expect(reset._tag).toBe("NotSynced")
  })
})

// ============================================
// GUARDS
// ============================================

describe("SyncStatusMachine.canSync", () => {
  it("returns true for NotSynced", () => {
    expect(SyncStatusMachine.canSync(MakeNotSynced())).toBe(true)
  })

  it("returns true for SyncFailed", () => {
    const failed = MakeSyncFailed({ error: syncError, failedAt: failDate, attempts: 1 })
    expect(SyncStatusMachine.canSync(failed)).toBe(true)
  })

  it("returns false for Synced", () => {
    const synced = MakeSynced({ shopifyProductId: shopifyId, syncedAt: syncDate })
    expect(SyncStatusMachine.canSync(synced)).toBe(false)
  })
})

describe("SyncStatusMachine.canReset", () => {
  it("returns false for NotSynced", () => {
    expect(SyncStatusMachine.canReset(MakeNotSynced())).toBe(false)
  })

  it("returns true for Synced", () => {
    const synced = MakeSynced({ shopifyProductId: shopifyId, syncedAt: syncDate })
    expect(SyncStatusMachine.canReset(synced)).toBe(true)
  })

  it("returns true for SyncFailed", () => {
    const failed = MakeSyncFailed({ error: syncError, failedAt: failDate, attempts: 1 })
    expect(SyncStatusMachine.canReset(failed)).toBe(true)
  })
})
