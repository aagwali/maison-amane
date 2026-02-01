package com.maisonamane.infrastructure.http.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CreatePilotProductRequest(
        @NotBlank(message = "Label is required") String label,
        @NotBlank(message = "Type is required") String type,
        @NotBlank(message = "Category is required") String category,
        @NotBlank(message = "Description is required") String description,
        @NotBlank(message = "Price range is required") String priceRange,
        @NotEmpty(message = "At least one variant is required") @Valid List<VariantRequest> variants,
        @NotEmpty(message = "At least one view is required") @Valid List<ViewRequest> views,
        @NotBlank(message = "Status is required") String status) {}
