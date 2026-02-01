package com.maisonamane.infrastructure.http.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record VariantRequest(
        @NotBlank(message = "Size is required") String size,
        @Valid CustomDimensionsRequest customDimensions,
        @Positive(message = "Price must be positive") Double price) {}
