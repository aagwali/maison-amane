package com.maisonamane.testutil;

import com.maisonamane.domain.pilot.valueobject.ProductId;
import com.maisonamane.domain.shared.CorrelationId;
import com.maisonamane.port.driven.service.IdGenerator;

/**
 * Deterministic ID generator for testing.
 * Generates sequential IDs for reproducible tests.
 * Maps Effect-TS DeterministicIdGeneratorLive to Java.
 */
public class DeterministicIdGenerator implements IdGenerator {

    private int productIdCounter = 0;
    private int correlationIdCounter = 0;

    @Override
    public ProductId generateProductId() {
        return ProductId.of("product-" + (++productIdCounter));
    }

    @Override
    public CorrelationId generateCorrelationId() {
        return CorrelationId.of("correlation-" + (++correlationIdCounter));
    }

    public void reset() {
        productIdCounter = 0;
        correlationIdCounter = 0;
    }

    public ProductId nextProductId() {
        return ProductId.of("product-" + (productIdCounter + 1));
    }
}
