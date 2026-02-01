package com.maisonamane.infrastructure.http.dto;

import jakarta.validation.constraints.Positive;

public record CustomDimensionsRequest(
        @Positive(message = "Width must be positive") double width,
        @Positive(message = "Length must be positive") double length) {}
