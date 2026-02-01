package com.maisonamane.domain.pilot.event;

import com.maisonamane.domain.pilot.valueobject.ProductId;
import com.maisonamane.domain.pilot.valueobject.ShopifyProductId;
import com.maisonamane.domain.shared.CorrelationId;
import com.maisonamane.domain.shared.UserId;
import java.time.Instant;
import java.util.Objects;

public record PilotProductSynced(
    ProductId productId,
    ShopifyProductId shopifyProductId,
    CorrelationId correlationId,
    UserId userId,
    Instant timestamp
) implements PilotDomainEvent {

    public PilotProductSynced {
        Objects.requireNonNull(productId, "ProductId cannot be null");
        Objects.requireNonNull(shopifyProductId, "ShopifyProductId cannot be null");
        Objects.requireNonNull(correlationId, "CorrelationId cannot be null");
        Objects.requireNonNull(userId, "UserId cannot be null");
        Objects.requireNonNull(timestamp, "Timestamp cannot be null");
    }

    public static PilotProductSynced of(
        ProductId productId,
        ShopifyProductId shopifyProductId,
        CorrelationId correlationId,
        UserId userId,
        Instant timestamp
    ) {
        return new PilotProductSynced(
            productId,
            shopifyProductId,
            correlationId,
            userId,
            timestamp
        );
    }

    @Override
    public String eventType() {
        return "PilotProductSynced";
    }
}
