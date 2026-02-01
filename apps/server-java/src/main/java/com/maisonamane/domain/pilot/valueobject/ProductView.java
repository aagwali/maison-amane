package com.maisonamane.domain.pilot.valueobject;

import com.maisonamane.domain.pilot.enums.ViewType;
import java.util.Objects;

public record ProductView(ViewType viewType, ImageUrl imageUrl) {

    public ProductView {
        Objects.requireNonNull(viewType, "ViewType cannot be null");
        Objects.requireNonNull(imageUrl, "ImageUrl cannot be null");
    }

    public static ProductView of(ViewType viewType, String imageUrl) {
        return new ProductView(viewType, ImageUrl.of(imageUrl));
    }
}
