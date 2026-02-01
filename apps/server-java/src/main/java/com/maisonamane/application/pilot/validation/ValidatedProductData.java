package com.maisonamane.application.pilot.validation;

import com.maisonamane.domain.pilot.entity.ProductVariant;
import com.maisonamane.domain.pilot.enums.PriceRange;
import com.maisonamane.domain.pilot.enums.ProductCategory;
import com.maisonamane.domain.pilot.enums.ProductStatus;
import com.maisonamane.domain.pilot.enums.ProductType;
import com.maisonamane.domain.pilot.valueobject.ProductDescription;
import com.maisonamane.domain.pilot.valueobject.ProductLabel;
import com.maisonamane.domain.pilot.valueobject.ProductViews;
import java.util.List;
import java.util.Objects;

/**
 * Validated product data after passing all validation rules.
 * Ready to be used to create the aggregate.
 */
public record ValidatedProductData(
    ProductLabel label,
    ProductType type,
    ProductCategory category,
    ProductDescription description,
    PriceRange priceRange,
    List<ProductVariant> variants,
    ProductViews views,
    ProductStatus status
) {

    public ValidatedProductData {
        Objects.requireNonNull(label, "Label cannot be null");
        Objects.requireNonNull(type, "Type cannot be null");
        Objects.requireNonNull(category, "Category cannot be null");
        Objects.requireNonNull(description, "Description cannot be null");
        Objects.requireNonNull(priceRange, "PriceRange cannot be null");
        Objects.requireNonNull(variants, "Variants cannot be null");
        Objects.requireNonNull(views, "Views cannot be null");
        Objects.requireNonNull(status, "Status cannot be null");

        if (variants.isEmpty()) {
            throw new IllegalArgumentException("At least one variant is required");
        }
        variants = List.copyOf(variants);
    }
}
