package com.maisonamane.domain.catalog.projection;

import com.maisonamane.domain.pilot.enums.PriceRange;
import com.maisonamane.domain.pilot.enums.ProductCategory;
import com.maisonamane.domain.pilot.valueobject.ProductDescription;
import com.maisonamane.domain.pilot.valueobject.ProductId;
import com.maisonamane.domain.pilot.valueobject.ProductLabel;
import io.vavr.control.Option;
import java.time.Instant;
import java.util.List;
import java.util.Objects;

/**
 * CatalogProduct - Read Model for UI.
 * Simplified projection of PilotProduct optimized for catalog display.
 */
public record CatalogProduct(
    ProductId id,
    ProductLabel label,
    ProductDescription description,
    ProductCategory category,
    PriceRange priceRange,
    List<CatalogVariant> variants,
    CatalogImages images,
    Option<String> shopifyUrl,
    Instant publishedAt
) {

    public CatalogProduct {
        Objects.requireNonNull(id, "Product ID cannot be null");
        Objects.requireNonNull(label, "Label cannot be null");
        Objects.requireNonNull(description, "Description cannot be null");
        Objects.requireNonNull(category, "Category cannot be null");
        Objects.requireNonNull(priceRange, "PriceRange cannot be null");
        Objects.requireNonNull(variants, "Variants cannot be null");
        Objects.requireNonNull(images, "Images cannot be null");
        Objects.requireNonNull(publishedAt, "PublishedAt cannot be null");
        shopifyUrl = shopifyUrl != null ? shopifyUrl : Option.none();
        variants = List.copyOf(variants);
    }

    public static CatalogProduct create(
        ProductId id,
        ProductLabel label,
        ProductDescription description,
        ProductCategory category,
        PriceRange priceRange,
        List<CatalogVariant> variants,
        CatalogImages images,
        Option<String> shopifyUrl,
        Instant publishedAt
    ) {
        return new CatalogProduct(
            id, label, description, category, priceRange,
            variants, images, shopifyUrl, publishedAt
        );
    }

    public CatalogProduct withShopifyUrl(String url) {
        return new CatalogProduct(
            id, label, description, category, priceRange,
            variants, images, Option.of(url), publishedAt
        );
    }
}
