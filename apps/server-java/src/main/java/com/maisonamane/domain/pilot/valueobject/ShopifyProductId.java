package com.maisonamane.domain.pilot.valueobject;

import java.util.Objects;

public record ShopifyProductId(String value) {

    public ShopifyProductId {
        Objects.requireNonNull(value, "ShopifyProductId value cannot be null");
        if (value.isBlank()) {
            throw new IllegalArgumentException("ShopifyProductId value cannot be blank");
        }
    }

    public static ShopifyProductId of(String value) {
        return new ShopifyProductId(value);
    }

    @Override
    public String toString() {
        return value;
    }
}
