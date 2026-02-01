package com.maisonamane.domain.pilot.valueobject;

public record Price(int valueInCentimes) {

    public Price {
        if (valueInCentimes <= 0) {
            throw new IllegalArgumentException("Price must be positive");
        }
    }

    public static Price of(int valueInCentimes) {
        return new Price(valueInCentimes);
    }

    public static Price fromEuros(double euros) {
        return new Price((int) Math.round(euros * 100));
    }

    public double toEuros() {
        return valueInCentimes / 100.0;
    }

    @Override
    public String toString() {
        return String.format("%.2f€", toEuros());
    }
}
