package com.maisonamane.application.pilot.command;

import com.maisonamane.domain.shared.CorrelationId;
import com.maisonamane.domain.shared.UserId;
import java.time.Instant;
import java.util.Objects;

/**
 * Command to create a new Pilot Product.
 * Maps Effect-TS TaggedStruct("CreatePilotProductCommand") to Java record.
 */
public record CreatePilotProductCommand(
    UnvalidatedProductData data,
    CorrelationId correlationId,
    UserId userId,
    Instant timestamp
) {

    public CreatePilotProductCommand {
        Objects.requireNonNull(data, "Data cannot be null");
        Objects.requireNonNull(correlationId, "CorrelationId cannot be null");
        Objects.requireNonNull(userId, "UserId cannot be null");
        Objects.requireNonNull(timestamp, "Timestamp cannot be null");
    }

    public static CreatePilotProductCommand of(
        UnvalidatedProductData data,
        CorrelationId correlationId,
        UserId userId,
        Instant timestamp
    ) {
        return new CreatePilotProductCommand(data, correlationId, userId, timestamp);
    }
}
