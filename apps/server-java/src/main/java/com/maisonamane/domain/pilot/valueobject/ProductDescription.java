package com.maisonamane.domain.pilot.valueobject;

import java.util.Objects;

public record ProductDescription(String value) {

    private static final int MAX_LENGTH = 5000;

    public ProductDescription {
        Objects.requireNonNull(value, "ProductDescription value cannot be null");
        if (value.length() > MAX_LENGTH) {
            throw new IllegalArgumentException(
                "ProductDescription cannot exceed " + MAX_LENGTH + " characters"
            );
        }
    }

    public static ProductDescription of(String value) {
        return new ProductDescription(value);
    }

    public static ProductDescription empty() {
        return new ProductDescription("");
    }

    @Override
    public String toString() {
        return value;
    }
}
