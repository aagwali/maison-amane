package com.maisonamane.port.driven.service;

import com.maisonamane.domain.pilot.valueobject.ProductId;
import com.maisonamane.domain.shared.CorrelationId;

/**
 * Interface for generating IDs.
 * Maps Effect-TS Context.Tag("IdGenerator") to Java interface.
 */
public interface IdGenerator {

    ProductId generateProductId();

    CorrelationId generateCorrelationId();
}
