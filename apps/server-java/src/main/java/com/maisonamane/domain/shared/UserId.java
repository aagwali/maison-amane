package com.maisonamane.domain.shared;

import java.util.Objects;

public record UserId(String value) {

    public UserId {
        Objects.requireNonNull(value, "UserId value cannot be null");
        if (value.isBlank()) {
            throw new IllegalArgumentException("UserId value cannot be blank");
        }
    }

    public static UserId of(String value) {
        return new UserId(value);
    }

    @Override
    public String toString() {
        return value;
    }
}
