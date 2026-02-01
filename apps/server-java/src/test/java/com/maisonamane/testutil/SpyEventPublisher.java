package com.maisonamane.testutil;

import com.maisonamane.port.driven.error.EventPublishError;
import com.maisonamane.port.driven.service.EventPublisher;
import io.vavr.control.Either;
import java.util.ArrayList;
import java.util.List;

/**
 * Spy event publisher for testing.
 * Captures published events for assertion in tests.
 * Maps Effect-TS SpyEventPublisherLive to Java.
 */
public class SpyEventPublisher implements EventPublisher {

    private final List<Object> publishedEvents = new ArrayList<>();

    @Override
    public Either<EventPublishError, Void> publish(Object event) {
        publishedEvents.add(event);
        return Either.right(null);
    }

    public List<Object> getPublishedEvents() {
        return List.copyOf(publishedEvents);
    }

    public int getEventCount() {
        return publishedEvents.size();
    }

    public <T> List<T> getEventsOfType(Class<T> eventType) {
        return publishedEvents.stream()
            .filter(eventType::isInstance)
            .map(eventType::cast)
            .toList();
    }

    public void clear() {
        publishedEvents.clear();
    }

    public boolean hasPublished(Class<?> eventType) {
        return publishedEvents.stream()
            .anyMatch(eventType::isInstance);
    }
}
