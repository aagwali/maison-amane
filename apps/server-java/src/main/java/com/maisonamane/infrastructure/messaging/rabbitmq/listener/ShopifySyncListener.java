package com.maisonamane.infrastructure.messaging.rabbitmq.listener;

import com.maisonamane.application.shopify.handler.ShopifySyncHandler;
import com.maisonamane.configuration.RabbitMQConfiguration;
import com.maisonamane.infrastructure.messaging.rabbitmq.dto.PilotProductPublishedMessage;
import com.maisonamane.infrastructure.messaging.rabbitmq.mapper.MessageToDomainMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class ShopifySyncListener {

    private static final Logger log = LoggerFactory.getLogger(ShopifySyncListener.class);

    private final ShopifySyncHandler handler;
    private final MessageToDomainMapper mapper;

    public ShopifySyncListener(ShopifySyncHandler handler, MessageToDomainMapper mapper) {
        this.handler = handler;
        this.mapper = mapper;
    }

    @RabbitListener(queues = RabbitMQConfiguration.QUEUE_SHOPIFY_SYNC)
    public void onProductPublished(PilotProductPublishedMessage message) {
        var correlationId = message.getCorrelationId().getValue();
        var productId = message.getProductId().getValue();

        log.info(
                "Received PilotProductPublished for Shopify sync - correlationId: {}, productId: {}",
                correlationId,
                productId);

        var product = mapper.toDomain(message.getProduct());

        handler.handle(product, correlationId)
                .peekLeft(
                        error ->
                                log.error(
                                        "Failed to sync product to Shopify - correlationId: {}, error: {}",
                                        correlationId,
                                        error.message()))
                .peek(
                        syncedProduct ->
                                log.info(
                                        "Successfully synced product to Shopify - correlationId: {}, productId: {}",
                                        correlationId,
                                        syncedProduct.id()));
    }
}
