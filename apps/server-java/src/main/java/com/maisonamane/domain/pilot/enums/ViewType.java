package com.maisonamane.domain.pilot.enums;

import java.util.List;

public enum ViewType {
    FRONT,
    DETAIL,
    BACK,
    AMBIANCE;

    public static final List<ViewType> REQUIRED_VIEW_TYPES = List.of(FRONT, DETAIL);
}
