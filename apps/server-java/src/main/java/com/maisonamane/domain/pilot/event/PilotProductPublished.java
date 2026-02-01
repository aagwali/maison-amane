package com.maisonamane.domain.pilot.event;

import com.maisonamane.domain.pilot.aggregate.PilotProduct;
import com.maisonamane.domain.pilot.valueobject.ProductId;
import com.maisonamane.domain.shared.CorrelationId;
import com.maisonamane.domain.shared.UserId;
import java.time.Instant;
import java.util.Objects;

public record PilotProductPublished(
    ProductId productId,
    PilotProduct product,
    CorrelationId correlationId,
    UserId userId,
    Instant timestamp
) implements PilotDomainEvent {

    public PilotProductPublished {
        Objects.requireNonNull(productId, "ProductId cannot be null");
        Objects.requireNonNull(product, "Product cannot be null");
        Objects.requireNonNull(correlationId, "CorrelationId cannot be null");
        Objects.requireNonNull(userId, "UserId cannot be null");
        Objects.requireNonNull(timestamp, "Timestamp cannot be null");
    }

    public static PilotProductPublished of(
        PilotProduct product,
        CorrelationId correlationId,
        UserId userId,
        Instant timestamp
    ) {
        return new PilotProductPublished(
            product.id(),
            product,
            correlationId,
            userId,
            timestamp
        );
    }

    @Override
    public String eventType() {
        return "PilotProductPublished";
    }
}
