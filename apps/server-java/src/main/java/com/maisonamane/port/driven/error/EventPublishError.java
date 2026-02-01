package com.maisonamane.port.driven.error;

/**
 * Error representing event publishing failures.
 * Maps Effect-TS Data.TaggedError("EventPublishError") to Java.
 */
public record EventPublishError(String eventType, String message, Throwable cause) {

    public EventPublishError(String eventType, String message) {
        this(eventType, message, null);
    }

    public static EventPublishError of(String eventType, String message) {
        return new EventPublishError(eventType, message);
    }

    public static EventPublishError of(String eventType, String message, Throwable cause) {
        return new EventPublishError(eventType, message, cause);
    }

    public static EventPublishError fromException(String eventType, Throwable cause) {
        return new EventPublishError(eventType, cause.getMessage(), cause);
    }
}
