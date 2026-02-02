# State Machines

## Pattern complet

Domain service pour gérer les transitions d'état :

```typescript
// domain/{context}/services/sync-status.machine.ts
import { MakeNotSynced, MakeSynced, MakeSyncFailed } from '../value-objects/sync-status'
import type { SyncStatus, NotSynced, Synced, SyncFailed } from '../value-objects/sync-status'

const MAX_RETRIES = 3

export const SyncStatusMachine = {
  // ==========================================================================
  // ÉTAT INITIAL
  // ==========================================================================

  initial: (): NotSynced => MakeNotSynced(),

  // ==========================================================================
  // TRANSITIONS
  // ==========================================================================

  markSynced: (
    _current: NotSynced | SyncFailed,
    shopifyProductId: string,
    syncedAt: Date
  ): Synced => MakeSynced({ shopifyProductId, syncedAt }),

  markFailed: (
    current: SyncStatus,
    error: { code: string; message: string },
    failedAt: Date
  ): SyncFailed =>
    MakeSyncFailed({
      error,
      failedAt,
      attempts: current._tag === 'SyncFailed' ? current.attempts + 1 : 1,
    }),

  reset: (_current: SyncFailed): NotSynced => MakeNotSynced(),

  // ==========================================================================
  // GUARDS (prédicats pour transitions valides)
  // ==========================================================================

  canSync: (status: SyncStatus): status is NotSynced | SyncFailed =>
    status._tag === 'NotSynced' || status._tag === 'SyncFailed',

  canReset: (status: SyncStatus): status is SyncFailed => status._tag === 'SyncFailed',

  canRetry: (status: SyncStatus): status is SyncFailed =>
    status._tag === 'SyncFailed' && status.attempts < MAX_RETRIES,

  // ==========================================================================
  // QUERIES
  // ==========================================================================

  isSynced: (status: SyncStatus): status is Synced => status._tag === 'Synced',

  getAttempts: (status: SyncStatus): number => (status._tag === 'SyncFailed' ? status.attempts : 0),
}
```

## Diagramme d'états

```
                    ┌─────────────┐
                    │  NotSynced  │ ◄─── initial()
                    └──────┬──────┘
                           │ markSynced()
                           ▼
    ┌──────────────────────────────────────────┐
    │                                          │
    │  markFailed()  ┌─────────────┐           │
    │ ┌──────────────►  SyncFailed │           │
    │ │              └──────┬──────┘           │
    │ │                     │                  │
    │ │   canRetry() ───────┼──► markSynced() ─┘
    │ │                     │
    │ │                     │ reset()
    │ │                     ▼
    │ │              ┌─────────────┐
    │ └──────────────│  NotSynced  │
    │                └─────────────┘
    │
    │  markSynced()  ┌─────────────┐
    └───────────────►│   Synced    │
                     └─────────────┘
```

## Utilisation dans un handler

```typescript
// application/shopify/handlers/shopify-sync.handler.ts
export const handleShopifySync = (event: PilotProductPublished) =>
  Effect.gen(function* () {
    const repo = yield* PilotProductRepository
    const shopify = yield* ShopifyClient
    const clock = yield* Clock

    // 1. Récupérer le produit
    const product = yield* repo.findById(event.productId)

    // 2. Vérifier si synchronisation possible (GUARD)
    if (!SyncStatusMachine.canSync(product.syncStatus)) {
      yield* Effect.logInfo('Product already synced, skipping')
      return product
    }

    // 3. Tenter la synchronisation
    const syncResult = yield* shopify.productSet(mapToShopify(product)).pipe(Effect.either)

    const now = yield* clock.now()

    // 4. Appliquer la transition
    const newSyncStatus =
      syncResult._tag === 'Right'
        ? SyncStatusMachine.markSynced(product.syncStatus, syncResult.right.id, now)
        : SyncStatusMachine.markFailed(
            product.syncStatus,
            { code: 'SYNC_ERROR', message: '...' },
            now
          )

    // 5. Persister
    return yield* repo.update({ ...product, syncStatus: newSyncStatus, updatedAt: now })
  })
```

## Tests

```typescript
// domain/{context}/services/sync-status.machine.test.ts
import { describe, expect, it } from 'vitest'
import { SyncStatusMachine, MakeNotSynced, MakeSyncFailed } from '../'

describe('SyncStatusMachine', () => {
  describe('initial', () => {
    it('returns NotSynced state', () => {
      const status = SyncStatusMachine.initial()
      expect(status._tag).toBe('NotSynced')
    })
  })

  describe('canSync', () => {
    it('returns true for NotSynced', () => {
      expect(SyncStatusMachine.canSync(MakeNotSynced())).toBe(true)
    })

    it('returns true for SyncFailed', () => {
      const failed = MakeSyncFailed({
        error: { code: 'E', message: 'm' },
        failedAt: new Date(),
        attempts: 1,
      })
      expect(SyncStatusMachine.canSync(failed)).toBe(true)
    })
  })

  describe('markFailed', () => {
    it('increments attempts on repeated failures', () => {
      const first = SyncStatusMachine.markFailed(
        MakeNotSynced(),
        { code: 'E', message: 'm' },
        new Date()
      )
      expect(first.attempts).toBe(1)

      const second = SyncStatusMachine.markFailed(first, { code: 'E', message: 'm' }, new Date())
      expect(second.attempts).toBe(2)
    })
  })

  describe('canRetry', () => {
    it('returns false when max retries reached', () => {
      const failed = MakeSyncFailed({
        error: { code: 'E', message: 'm' },
        failedAt: new Date(),
        attempts: 3,
      })
      expect(SyncStatusMachine.canRetry(failed)).toBe(false)
    })
  })
})
```

## Checklist

- [ ] Objet singleton avec méthodes statiques
- [ ] `initial()` pour état de départ
- [ ] Transitions retournent le nouvel état (pas de mutation)
- [ ] Guards avec type predicates (`status is State`)
- [ ] Signatures de transition typées (from: ValidStates)
- [ ] Tests unitaires purs (pas d'Effect Layer)
