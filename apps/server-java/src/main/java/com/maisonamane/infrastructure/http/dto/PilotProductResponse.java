package com.maisonamane.infrastructure.http.dto;

import java.time.Instant;
import java.util.List;

public record PilotProductResponse(
        String id,
        String label,
        String type,
        String category,
        String description,
        String priceRange,
        List<VariantResponse> variants,
        ViewsResponse views,
        String status,
        SyncStatusResponse syncStatus,
        Instant createdAt,
        Instant updatedAt) {}
