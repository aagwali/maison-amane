package com.maisonamane.domain.pilot.event;

import com.maisonamane.domain.shared.CorrelationId;
import com.maisonamane.domain.shared.UserId;
import java.time.Instant;

/**
 * Sealed interface for Pilot domain events.
 * Maps Effect-TS union type to Java sealed interface.
 */
public sealed interface PilotDomainEvent permits PilotProductPublished, PilotProductSynced {

    CorrelationId correlationId();

    UserId userId();

    Instant timestamp();

    String eventType();
}
