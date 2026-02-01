package com.maisonamane.infrastructure.messaging.rabbitmq.listener;

import com.maisonamane.application.catalog.handler.CatalogProjectionHandler;
import com.maisonamane.configuration.RabbitMQConfiguration;
import com.maisonamane.infrastructure.messaging.rabbitmq.dto.PilotProductPublishedMessage;
import com.maisonamane.infrastructure.messaging.rabbitmq.mapper.MessageToDomainMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class CatalogProjectionListener {

    private static final Logger log = LoggerFactory.getLogger(CatalogProjectionListener.class);

    private final CatalogProjectionHandler handler;
    private final MessageToDomainMapper mapper;

    public CatalogProjectionListener(
            CatalogProjectionHandler handler, MessageToDomainMapper mapper) {
        this.handler = handler;
        this.mapper = mapper;
    }

    @RabbitListener(queues = RabbitMQConfiguration.QUEUE_CATALOG_PROJECTION)
    public void onProductPublished(PilotProductPublishedMessage message) {
        var correlationId = message.getCorrelationId().getValue();
        var productId = message.getProductId().getValue();

        log.info(
                "Received PilotProductPublished - correlationId: {}, productId: {}",
                correlationId,
                productId);

        var product = mapper.toDomain(message.getProduct());

        handler.handle(product, correlationId, message.getTimestamp())
                .peekLeft(
                        error ->
                                log.error(
                                        "Failed to project product - correlationId: {}, error: {}",
                                        correlationId,
                                        error.message()))
                .peek(
                        catalogProduct ->
                                log.info(
                                        "Successfully projected product - correlationId: {}, catalogId: {}",
                                        correlationId,
                                        catalogProduct.id()));
    }
}
