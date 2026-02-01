package com.maisonamane.domain.pilot.aggregate;

import com.maisonamane.domain.pilot.entity.ProductVariant;
import com.maisonamane.domain.pilot.enums.PriceRange;
import com.maisonamane.domain.pilot.enums.ProductCategory;
import com.maisonamane.domain.pilot.enums.ProductStatus;
import com.maisonamane.domain.pilot.enums.ProductType;
import com.maisonamane.domain.pilot.valueobject.ProductDescription;
import com.maisonamane.domain.pilot.valueobject.ProductId;
import com.maisonamane.domain.pilot.valueobject.ProductLabel;
import com.maisonamane.domain.pilot.valueobject.ProductViews;
import com.maisonamane.domain.pilot.valueobject.SyncStatus;
import java.time.Instant;
import java.util.List;
import java.util.Objects;

/**
 * PilotProduct Aggregate Root.
 *
 * The aggregate is the guardian of INVARIANTS - rules that must always be true
 * for the entity to be in a valid state.
 *
 * Invariants:
 * - variants must contain at least one item (NonEmpty)
 * - label, type, category are required
 * - views must have front and detail
 */
public record PilotProduct(
    ProductId id,
    ProductLabel label,
    ProductType type,
    ProductCategory category,
    ProductDescription description,
    PriceRange priceRange,
    List<ProductVariant> variants,
    ProductViews views,
    ProductStatus status,
    SyncStatus syncStatus,
    Instant createdAt,
    Instant updatedAt
) {

    public PilotProduct {
        Objects.requireNonNull(id, "Product ID cannot be null");
        Objects.requireNonNull(label, "Product label cannot be null");
        Objects.requireNonNull(type, "Product type cannot be null");
        Objects.requireNonNull(category, "Product category cannot be null");
        Objects.requireNonNull(description, "Product description cannot be null");
        Objects.requireNonNull(priceRange, "Price range cannot be null");
        Objects.requireNonNull(variants, "Variants cannot be null");
        Objects.requireNonNull(views, "Views cannot be null");
        Objects.requireNonNull(status, "Status cannot be null");
        Objects.requireNonNull(syncStatus, "Sync status cannot be null");
        Objects.requireNonNull(createdAt, "CreatedAt cannot be null");
        Objects.requireNonNull(updatedAt, "UpdatedAt cannot be null");

        if (variants.isEmpty()) {
            throw new IllegalArgumentException("At least one variant is required");
        }
        variants = List.copyOf(variants);
    }

    /**
     * Factory method to create a new PilotProduct.
     */
    public static PilotProduct create(
        ProductId id,
        ProductLabel label,
        ProductType type,
        ProductCategory category,
        ProductDescription description,
        PriceRange priceRange,
        List<ProductVariant> variants,
        ProductViews views,
        ProductStatus status,
        Instant now
    ) {
        return new PilotProduct(
            id,
            label,
            type,
            category,
            description,
            priceRange,
            variants,
            views,
            status,
            SyncStatus.notSynced(),
            now,
            now
        );
    }

    /**
     * Returns a new product with updated fields.
     */
    public PilotProduct withUpdatedAt(Instant updatedAt) {
        return new PilotProduct(
            id, label, type, category, description, priceRange,
            variants, views, status, syncStatus, createdAt, updatedAt
        );
    }

    public PilotProduct withStatus(ProductStatus newStatus, Instant updatedAt) {
        return new PilotProduct(
            id, label, type, category, description, priceRange,
            variants, views, newStatus, syncStatus, createdAt, updatedAt
        );
    }

    public PilotProduct withSyncStatus(SyncStatus newSyncStatus, Instant updatedAt) {
        return new PilotProduct(
            id, label, type, category, description, priceRange,
            variants, views, status, newSyncStatus, createdAt, updatedAt
        );
    }

    public boolean isPublished() {
        return status == ProductStatus.PUBLISHED;
    }

    public boolean isDraft() {
        return status == ProductStatus.DRAFT;
    }

    public boolean isArchived() {
        return status == ProductStatus.ARCHIVED;
    }
}
