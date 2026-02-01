package com.maisonamane.domain.pilot.valueobject;

import java.util.Objects;

public record SyncError(String code, String message, Object details) {

    public SyncError {
        Objects.requireNonNull(code, "Error code cannot be null");
        Objects.requireNonNull(message, "Error message cannot be null");
    }

    public static SyncError of(String code, String message) {
        return new SyncError(code, message, null);
    }

    public static SyncError of(String code, String message, Object details) {
        return new SyncError(code, message, details);
    }
}
