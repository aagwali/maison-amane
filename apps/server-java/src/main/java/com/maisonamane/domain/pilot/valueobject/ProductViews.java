package com.maisonamane.domain.pilot.valueobject;

import java.util.List;
import java.util.Objects;

public record ProductViews(
    ProductView front,
    ProductView detail,
    List<ProductView> additional
) {

    public ProductViews {
        Objects.requireNonNull(front, "Front view cannot be null");
        Objects.requireNonNull(detail, "Detail view cannot be null");
        additional = additional != null ? List.copyOf(additional) : List.of();
    }

    public static ProductViews of(ProductView front, ProductView detail, List<ProductView> additional) {
        return new ProductViews(front, detail, additional);
    }

    public static ProductViews of(ProductView front, ProductView detail) {
        return new ProductViews(front, detail, List.of());
    }

    public List<ProductView> allViews() {
        return List.of(front, detail);
    }
}
