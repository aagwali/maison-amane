package com.maisonamane.infrastructure.http.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SyncStatusResponse(
        String tag,
        String shopifyProductId,
        Instant syncedAt,
        SyncErrorResponse error,
        Instant failedAt,
        Integer attempts) {

    public static SyncStatusResponse notSynced() {
        return new SyncStatusResponse("NotSynced", null, null, null, null, null);
    }

    public static SyncStatusResponse synced(String shopifyProductId, Instant syncedAt) {
        return new SyncStatusResponse("Synced", shopifyProductId, syncedAt, null, null, null);
    }

    public static SyncStatusResponse syncFailed(SyncErrorResponse error, Instant failedAt, int attempts) {
        return new SyncStatusResponse("SyncFailed", null, null, error, failedAt, attempts);
    }
}
