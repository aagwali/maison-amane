package com.maisonamane.domain.pilot.service;

import com.maisonamane.domain.pilot.valueobject.ShopifyProductId;
import com.maisonamane.domain.pilot.valueobject.SyncError;
import com.maisonamane.domain.pilot.valueobject.SyncStatus;
import com.maisonamane.domain.pilot.valueobject.SyncStatus.NotSynced;
import com.maisonamane.domain.pilot.valueobject.SyncStatus.Synced;
import com.maisonamane.domain.pilot.valueobject.SyncStatus.SyncFailed;
import java.time.Instant;

/**
 * State machine for SyncStatus transitions.
 * Maps Effect-TS SyncStatusMachine to Java.
 *
 * Valid transitions:
 * - NotSynced -> Synced (markSynced)
 * - NotSynced -> SyncFailed (markFailed)
 * - SyncFailed -> Synced (markSynced)
 * - SyncFailed -> SyncFailed (markFailed, increments attempts)
 * - Synced -> NotSynced (reset)
 * - SyncFailed -> NotSynced (reset)
 */
public final class SyncStatusMachine {

    private SyncStatusMachine() {
    }

    // Initial state
    public static NotSynced initial() {
        return SyncStatus.notSynced();
    }

    // Transitions

    /**
     * Marks the sync as successful.
     * Valid from: NotSynced, SyncFailed
     */
    public static Synced markSynced(
        SyncStatus current,
        ShopifyProductId shopifyProductId,
        Instant syncedAt
    ) {
        if (!canSync(current)) {
            throw new IllegalStateException(
                "Cannot mark as synced from state: " + current.getClass().getSimpleName()
            );
        }
        return SyncStatus.synced(shopifyProductId, syncedAt);
    }

    /**
     * Marks the sync as failed.
     * Valid from: NotSynced, SyncFailed
     * Increments attempts if already in SyncFailed state.
     */
    public static SyncFailed markFailed(
        SyncStatus current,
        SyncError error,
        Instant failedAt
    ) {
        if (!canSync(current)) {
            throw new IllegalStateException(
                "Cannot mark as failed from state: " + current.getClass().getSimpleName()
            );
        }
        int attempts = current instanceof SyncFailed failed ? failed.attempts() + 1 : 1;
        return SyncStatus.syncFailed(error, failedAt, attempts);
    }

    /**
     * Resets the sync status to NotSynced.
     * Valid from: Synced, SyncFailed
     */
    public static NotSynced reset(SyncStatus current) {
        if (!canReset(current)) {
            throw new IllegalStateException(
                "Cannot reset from state: " + current.getClass().getSimpleName()
            );
        }
        return SyncStatus.notSynced();
    }

    // Guards

    /**
     * Checks if sync can be attempted (markSynced or markFailed).
     */
    public static boolean canSync(SyncStatus status) {
        return status instanceof NotSynced || status instanceof SyncFailed;
    }

    /**
     * Checks if status can be reset.
     */
    public static boolean canReset(SyncStatus status) {
        return status instanceof Synced || status instanceof SyncFailed;
    }

    /**
     * Checks if status is Synced.
     */
    public static boolean isSynced(SyncStatus status) {
        return status instanceof Synced;
    }

    /**
     * Checks if status is SyncFailed.
     */
    public static boolean isFailed(SyncStatus status) {
        return status instanceof SyncFailed;
    }

    /**
     * Checks if status is NotSynced.
     */
    public static boolean isNotSynced(SyncStatus status) {
        return status instanceof NotSynced;
    }
}
