package com.maisonamane.domain.catalog.projection;

import com.maisonamane.domain.pilot.valueobject.ImageUrl;
import java.util.List;
import java.util.Objects;

public record CatalogImages(
    ImageUrl front,
    ImageUrl detail,
    List<ImageUrl> gallery
) {

    public CatalogImages {
        Objects.requireNonNull(front, "Front image cannot be null");
        Objects.requireNonNull(detail, "Detail image cannot be null");
        gallery = gallery != null ? List.copyOf(gallery) : List.of();
    }

    public static CatalogImages of(ImageUrl front, ImageUrl detail, List<ImageUrl> gallery) {
        return new CatalogImages(front, detail, gallery);
    }

    public static CatalogImages of(ImageUrl front, ImageUrl detail) {
        return new CatalogImages(front, detail, List.of());
    }
}
