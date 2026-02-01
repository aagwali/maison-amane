package com.maisonamane.domain.catalog.event;

import com.maisonamane.domain.pilot.valueobject.ProductId;
import com.maisonamane.domain.shared.CorrelationId;
import com.maisonamane.domain.shared.UserId;
import java.time.Instant;
import java.util.Objects;

public record CatalogProductProjected(
    ProductId productId,
    CorrelationId correlationId,
    UserId userId,
    Instant timestamp
) implements CatalogDomainEvent {

    public CatalogProductProjected {
        Objects.requireNonNull(productId, "ProductId cannot be null");
        Objects.requireNonNull(correlationId, "CorrelationId cannot be null");
        Objects.requireNonNull(userId, "UserId cannot be null");
        Objects.requireNonNull(timestamp, "Timestamp cannot be null");
    }

    public static CatalogProductProjected of(
        ProductId productId,
        CorrelationId correlationId,
        UserId userId,
        Instant timestamp
    ) {
        return new CatalogProductProjected(productId, correlationId, userId, timestamp);
    }

    @Override
    public String eventType() {
        return "CatalogProductProjected";
    }
}
