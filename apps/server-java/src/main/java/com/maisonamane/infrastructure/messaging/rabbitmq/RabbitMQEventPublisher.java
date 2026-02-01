package com.maisonamane.infrastructure.messaging.rabbitmq;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.maisonamane.domain.catalog.event.CatalogDomainEvent;
import com.maisonamane.domain.pilot.event.PilotDomainEvent;
import com.maisonamane.port.driven.error.EventPublishError;
import com.maisonamane.port.driven.service.EventPublisher;
import io.vavr.control.Either;
import io.vavr.control.Try;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

/**
 * RabbitMQ implementation of EventPublisher.
 * Maps Effect-TS RabbitMQEventPublisherLayer to Spring @Component.
 */
@Component
public class RabbitMQEventPublisher implements EventPublisher {

    private static final Logger log = LoggerFactory.getLogger(RabbitMQEventPublisher.class);

    private static final String EXCHANGE = "pilot.events";

    // Routing keys
    private static final String PILOT_PRODUCT_PUBLISHED = "product.published";
    private static final String PILOT_PRODUCT_SYNCED = "product.synced";
    private static final String CATALOG_PRODUCT_PROJECTED = "catalog.projected";

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;

    public RabbitMQEventPublisher(RabbitTemplate rabbitTemplate, ObjectMapper objectMapper) {
        this.rabbitTemplate = rabbitTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public Either<EventPublishError, Void> publish(Object event) {
        return Try.run(() -> {
                String routingKey = getRoutingKey(event);
                byte[] messageBody = serializeEvent(event);

                MessageProperties properties = new MessageProperties();
                properties.setContentType("application/json");
                properties.getHeaders().put("eventType", getEventType(event));
                properties.getHeaders().put("correlationId", getCorrelationId(event));
                properties.getHeaders().put("userId", getUserId(event));
                properties.setDeliveryMode(MessageProperties.DEFAULT_DELIVERY_MODE); // Persistent

                Message message = new Message(messageBody, properties);

                rabbitTemplate.send(EXCHANGE, routingKey, message);

                log.info("Domain event published to RabbitMQ: eventType={}, exchange={}, routingKey={}",
                    getEventType(event), EXCHANGE, routingKey);
            })
            .toEither()
            .mapLeft(e -> EventPublishError.fromException(getEventType(event), e))
            .map(v -> null); // Convert to Void
    }

    private String getRoutingKey(Object event) {
        return switch (event) {
            case PilotDomainEvent pilotEvent -> switch (pilotEvent.eventType()) {
                case "PilotProductPublished" -> PILOT_PRODUCT_PUBLISHED;
                case "PilotProductSynced" -> PILOT_PRODUCT_SYNCED;
                default -> throw new IllegalArgumentException("Unknown pilot event type: " + pilotEvent.eventType());
            };
            case CatalogDomainEvent catalogEvent -> CATALOG_PRODUCT_PROJECTED;
            default -> throw new IllegalArgumentException("Unknown event type: " + event.getClass().getName());
        };
    }

    private byte[] serializeEvent(Object event) throws Exception {
        return objectMapper.writeValueAsBytes(event);
    }

    private String getEventType(Object event) {
        if (event instanceof PilotDomainEvent pilotEvent) {
            return pilotEvent.eventType();
        } else if (event instanceof CatalogDomainEvent catalogEvent) {
            return catalogEvent.eventType();
        }
        return event.getClass().getSimpleName();
    }

    private String getCorrelationId(Object event) {
        if (event instanceof PilotDomainEvent pilotEvent) {
            return pilotEvent.correlationId().value();
        } else if (event instanceof CatalogDomainEvent catalogEvent) {
            return catalogEvent.correlationId().value();
        }
        return "";
    }

    private String getUserId(Object event) {
        if (event instanceof PilotDomainEvent pilotEvent) {
            return pilotEvent.userId().value();
        } else if (event instanceof CatalogDomainEvent catalogEvent) {
            return catalogEvent.userId().value();
        }
        return "";
    }
}
