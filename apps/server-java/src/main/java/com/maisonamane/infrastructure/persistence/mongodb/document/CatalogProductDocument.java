package com.maisonamane.infrastructure.persistence.mongodb.document;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "catalog_products")
public record CatalogProductDocument(
        @Id String id,
        String label,
        String description,
        String category,
        String priceRange,
        List<VariantDoc> variants,
        ImagesDoc images,
        String shopifyUrl,
        Instant publishedAt) {

    public record VariantDoc(String _tag, String size, Map<String, Integer> dimensions, Integer price) {}

    public record ImagesDoc(String front, String detail, List<String> gallery) {}
}
