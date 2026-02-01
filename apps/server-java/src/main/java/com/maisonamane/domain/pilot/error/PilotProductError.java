package com.maisonamane.domain.pilot.error;

/**
 * Sealed interface for Pilot domain errors.
 * Maps Effect-TS Data.TaggedError union to Java sealed interface.
 */
public sealed interface PilotProductError permits
    PilotProductError.ValidationError,
    PilotProductError.PersistenceError,
    PilotProductError.NotFoundError {

    String message();

    record ValidationError(String message, Object cause) implements PilotProductError {
        public ValidationError(String message) {
            this(message, null);
        }

        public static ValidationError of(String message) {
            return new ValidationError(message);
        }

        public static ValidationError of(String message, Object cause) {
            return new ValidationError(message, cause);
        }
    }

    record PersistenceError(String message, Throwable cause) implements PilotProductError {
        public PersistenceError(String message) {
            this(message, null);
        }

        public static PersistenceError of(String message) {
            return new PersistenceError(message);
        }

        public static PersistenceError of(String message, Throwable cause) {
            return new PersistenceError(message, cause);
        }
    }

    record NotFoundError(String message) implements PilotProductError {
        public static NotFoundError of(String productId) {
            return new NotFoundError("Product not found: " + productId);
        }
    }
}
