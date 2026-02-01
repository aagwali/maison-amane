package com.maisonamane.application.catalog.mapper;

import com.maisonamane.domain.catalog.projection.CatalogImages;
import com.maisonamane.domain.catalog.projection.CatalogProduct;
import com.maisonamane.domain.catalog.projection.CatalogVariant;
import com.maisonamane.domain.catalog.projection.CatalogVariant.CatalogDimensions;
import com.maisonamane.domain.pilot.aggregate.PilotProduct;
import com.maisonamane.domain.pilot.entity.ProductVariant;
import com.maisonamane.domain.pilot.entity.ProductVariant.CustomVariant;
import com.maisonamane.domain.pilot.entity.ProductVariant.StandardVariant;
import com.maisonamane.domain.pilot.valueobject.ImageUrl;
import io.vavr.control.Option;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class CatalogProjectionMapper {

    public CatalogProduct projectToCatalog(PilotProduct pilot, Instant publishedAt) {
        return CatalogProduct.create(
                pilot.id(),
                pilot.label(),
                pilot.description(),
                pilot.category(),
                pilot.priceRange(),
                projectVariants(pilot.variants()),
                projectImages(pilot),
                Option.none(),
                publishedAt);
    }

    private List<CatalogVariant> projectVariants(List<ProductVariant> variants) {
        return variants.stream().map(this::projectVariant).toList();
    }

    private CatalogVariant projectVariant(ProductVariant variant) {
        return switch (variant) {
            case StandardVariant std -> new CatalogVariant.StandardVariant(std.size());
            case CustomVariant custom -> new CatalogVariant.CustomVariant(
                    CatalogDimensions.of(
                            custom.customDimensions().width().value(),
                            custom.customDimensions().length().value()),
                    custom.price());
        };
    }

    private CatalogImages projectImages(PilotProduct pilot) {
        var views = pilot.views();
        List<ImageUrl> gallery =
                views.additional().stream().map(v -> v.imageUrl()).toList();

        return CatalogImages.of(views.front().imageUrl(), views.detail().imageUrl(), gallery);
    }
}
