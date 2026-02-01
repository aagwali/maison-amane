package com.maisonamane.domain.pilot.valueobject;

import java.util.Objects;
import java.util.UUID;

public record ProductId(String value) {

    public ProductId {
        Objects.requireNonNull(value, "ProductId value cannot be null");
        if (value.isBlank()) {
            throw new IllegalArgumentException("ProductId value cannot be blank");
        }
    }

    public static ProductId of(String value) {
        return new ProductId(value);
    }

    public static ProductId generate() {
        return new ProductId(UUID.randomUUID().toString());
    }

    @Override
    public String toString() {
        return value;
    }
}
