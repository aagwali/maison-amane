package com.maisonamane.domain.shared;

import java.util.Objects;
import java.util.UUID;

public record CorrelationId(String value) {

    public CorrelationId {
        Objects.requireNonNull(value, "CorrelationId value cannot be null");
        if (value.isBlank()) {
            throw new IllegalArgumentException("CorrelationId value cannot be blank");
        }
    }

    public static CorrelationId of(String value) {
        return new CorrelationId(value);
    }

    public static CorrelationId generate() {
        return new CorrelationId(UUID.randomUUID().toString());
    }

    @Override
    public String toString() {
        return value;
    }
}
