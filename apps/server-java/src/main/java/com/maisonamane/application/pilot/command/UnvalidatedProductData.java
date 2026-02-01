package com.maisonamane.application.pilot.command;

import java.util.List;

/**
 * Unvalidated product data from API boundary.
 * All fields are raw strings/numbers that need validation.
 */
public record UnvalidatedProductData(
    String label,
    String type,
    String category,
    String description,
    String priceRange,
    List<UnvalidatedVariant> variants,
    List<UnvalidatedView> views,
    String status
) {

    public record UnvalidatedVariant(
        String size,
        UnvalidatedDimensions customDimensions,
        Integer price
    ) {}

    public record UnvalidatedDimensions(
        Integer width,
        Integer length
    ) {}

    public record UnvalidatedView(
        String viewType,
        String imageUrl
    ) {}
}
