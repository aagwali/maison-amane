package com.maisonamane.infrastructure.http.dto;

import jakarta.validation.constraints.NotBlank;

public record ViewRequest(
        @NotBlank(message = "View type is required") String viewType,
        @NotBlank(message = "Image URL is required") String imageUrl) {}
