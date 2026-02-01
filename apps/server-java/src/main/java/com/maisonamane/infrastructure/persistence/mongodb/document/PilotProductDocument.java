package com.maisonamane.infrastructure.persistence.mongodb.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.List;

/**
 * MongoDB document for PilotProduct.
 * Uses string _id instead of ObjectId for direct UUID storage.
 */
@Document(collection = "pilot_products")
public record PilotProductDocument(
    @Id String id,
    String label,
    String type,
    String category,
    String description,
    String priceRange,
    List<VariantDocument> variants,
    ViewsDocument views,
    String status,
    SyncStatusDocument syncStatus,
    Instant createdAt,
    Instant updatedAt
) {

    public record VariantDocument(
        String tag,
        String size,
        DimensionsDocument customDimensions,
        Integer price
    ) {}

    public record DimensionsDocument(
        Integer width,
        Integer length
    ) {}

    public record ViewsDocument(
        ViewDocument front,
        ViewDocument detail,
        List<ViewDocument> additional
    ) {}

    public record ViewDocument(
        String viewType,
        String imageUrl
    ) {}

    public record SyncStatusDocument(
        String tag,
        String shopifyProductId,
        Instant syncedAt,
        SyncErrorDocument error,
        Instant failedAt,
        Integer attempts
    ) {}

    public record SyncErrorDocument(
        String code,
        String message,
        Object details
    ) {}
}
