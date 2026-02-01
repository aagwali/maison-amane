package com.maisonamane.domain.pilot.valueobject;

import java.util.Objects;

public record CustomDimension(PositiveCm width, PositiveCm length) {

    public CustomDimension {
        Objects.requireNonNull(width, "Width cannot be null");
        Objects.requireNonNull(length, "Length cannot be null");
    }

    public static CustomDimension of(int widthCm, int lengthCm) {
        return new CustomDimension(PositiveCm.of(widthCm), PositiveCm.of(lengthCm));
    }

    @Override
    public String toString() {
        return width + " x " + length;
    }
}
