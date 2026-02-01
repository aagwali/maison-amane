package com.maisonamane.port.driven.service;

import com.maisonamane.port.driven.error.EventPublishError;
import io.vavr.control.Either;

/**
 * Interface for publishing domain events.
 * Maps Effect-TS Context.Tag("EventPublisher") to Java interface.
 */
public interface EventPublisher {

    /**
     * Publish a domain event.
     *
     * @param event the domain event to publish
     * @return Either containing an error on the left, or void (Unit) on the right
     */
    Either<EventPublishError, Void> publish(Object event);
}
