package com.maisonamane.domain.catalog.event;

import com.maisonamane.domain.shared.CorrelationId;
import com.maisonamane.domain.shared.UserId;
import java.time.Instant;

/**
 * Sealed interface for Catalog domain events.
 */
public sealed interface CatalogDomainEvent permits CatalogProductProjected {

    CorrelationId correlationId();

    UserId userId();

    Instant timestamp();

    String eventType();
}
