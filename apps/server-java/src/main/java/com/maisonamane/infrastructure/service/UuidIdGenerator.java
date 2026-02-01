package com.maisonamane.infrastructure.service;

import com.maisonamane.domain.pilot.valueobject.ProductId;
import com.maisonamane.domain.shared.CorrelationId;
import org.springframework.stereotype.Component;
import java.util.UUID;

/**
 * UUID-based ID generator.
 * Maps Effect-TS UuidIdGeneratorLive to Spring @Component.
 */
@Component
public class UuidIdGenerator implements com.maisonamane.port.driven.service.IdGenerator {

    @Override
    public ProductId generateProductId() {
        return ProductId.of(UUID.randomUUID().toString());
    }

    @Override
    public CorrelationId generateCorrelationId() {
        return CorrelationId.generate();
    }
}
