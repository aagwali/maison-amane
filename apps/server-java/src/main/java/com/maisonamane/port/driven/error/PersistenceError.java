package com.maisonamane.port.driven.error;

/**
 * Error representing persistence failures.
 * Maps Effect-TS Data.TaggedError("PersistenceError") to Java.
 */
public record PersistenceError(String message, Throwable cause) {

    public PersistenceError(String message) {
        this(message, null);
    }

    public static PersistenceError of(String message) {
        return new PersistenceError(message);
    }

    public static PersistenceError of(String message, Throwable cause) {
        return new PersistenceError(message, cause);
    }

    public static PersistenceError fromException(Throwable cause) {
        return new PersistenceError(cause.getMessage(), cause);
    }
}
