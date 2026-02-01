package com.maisonamane.domain.pilot.valueobject;

import java.util.Objects;
import java.util.UUID;

public record VariantId(String value) {

    public VariantId {
        Objects.requireNonNull(value, "VariantId value cannot be null");
        if (value.isBlank()) {
            throw new IllegalArgumentException("VariantId value cannot be blank");
        }
    }

    public static VariantId of(String value) {
        return new VariantId(value);
    }

    public static VariantId generate() {
        return new VariantId(UUID.randomUUID().toString());
    }

    @Override
    public String toString() {
        return value;
    }
}
