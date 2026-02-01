package com.maisonamane.domain.pilot.valueobject;

public record PositiveCm(int value) {

    public PositiveCm {
        if (value <= 0) {
            throw new IllegalArgumentException("Dimension must be positive");
        }
    }

    public static PositiveCm of(int value) {
        return new PositiveCm(value);
    }

    @Override
    public String toString() {
        return value + "cm";
    }
}
