package com.maisonamane.domain.pilot.enums;

public enum Size {
    REGULAR,
    LARGE,
    CUSTOM;

    public boolean isPredefined() {
        return this != CUSTOM;
    }
}
