package com.maisonamane.domain.pilot.valueobject;

import java.time.Instant;
import java.util.Objects;

/**
 * Sealed interface representing the sync status state machine.
 * Maps Effect-TS S.Union(NotSynced, Synced, SyncFailed) to Java sealed interface.
 */
public sealed interface SyncStatus permits SyncStatus.NotSynced, SyncStatus.Synced, SyncStatus.SyncFailed {

    record NotSynced() implements SyncStatus {
        private static final NotSynced INSTANCE = new NotSynced();

        public static NotSynced instance() {
            return INSTANCE;
        }
    }

    record Synced(ShopifyProductId shopifyProductId, Instant syncedAt) implements SyncStatus {
        public Synced {
            Objects.requireNonNull(shopifyProductId, "ShopifyProductId cannot be null");
            Objects.requireNonNull(syncedAt, "SyncedAt cannot be null");
        }

        public static Synced of(ShopifyProductId shopifyProductId, Instant syncedAt) {
            return new Synced(shopifyProductId, syncedAt);
        }
    }

    record SyncFailed(SyncError error, Instant failedAt, int attempts) implements SyncStatus {
        public SyncFailed {
            Objects.requireNonNull(error, "Error cannot be null");
            Objects.requireNonNull(failedAt, "FailedAt cannot be null");
            if (attempts < 1) {
                throw new IllegalArgumentException("Attempts must be at least 1");
            }
        }

        public static SyncFailed of(SyncError error, Instant failedAt, int attempts) {
            return new SyncFailed(error, failedAt, attempts);
        }
    }

    // Factory methods
    static NotSynced notSynced() {
        return NotSynced.instance();
    }

    static Synced synced(ShopifyProductId shopifyProductId, Instant syncedAt) {
        return Synced.of(shopifyProductId, syncedAt);
    }

    static SyncFailed syncFailed(SyncError error, Instant failedAt, int attempts) {
        return SyncFailed.of(error, failedAt, attempts);
    }

    // Type checks
    default boolean isNotSynced() {
        return this instanceof NotSynced;
    }

    default boolean isSynced() {
        return this instanceof Synced;
    }

    default boolean isSyncFailed() {
        return this instanceof SyncFailed;
    }
}
