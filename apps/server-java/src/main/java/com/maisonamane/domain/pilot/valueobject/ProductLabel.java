package com.maisonamane.domain.pilot.valueobject;

import java.util.Objects;

public record ProductLabel(String value) {

    private static final int MAX_LENGTH = 255;

    public ProductLabel {
        Objects.requireNonNull(value, "ProductLabel value cannot be null");
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("ProductLabel cannot be empty");
        }
        if (trimmed.length() > MAX_LENGTH) {
            throw new IllegalArgumentException(
                "ProductLabel cannot exceed " + MAX_LENGTH + " characters"
            );
        }
    }

    public static ProductLabel of(String value) {
        return new ProductLabel(value.trim());
    }

    @Override
    public String toString() {
        return value;
    }
}
