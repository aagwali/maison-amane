package com.maisonamane.configuration;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;

/**
 * RabbitMQ configuration.
 * Maps Effect-TS RabbitMQ topology to Spring AMQP configuration.
 */
@Configuration
public class RabbitMQConfiguration {

    public static final String EXCHANGE_PILOT_EVENTS = "pilot.events";
    public static final String EXCHANGE_PILOT_EVENTS_DLX = "pilot.events.dlx";

    public static final String ROUTING_KEY_PRODUCT_PUBLISHED = "product.published";
    public static final String ROUTING_KEY_PRODUCT_SYNCED = "product.synced";
    public static final String ROUTING_KEY_CATALOG_PROJECTED = "catalog.projected";

    // Consumer queues
    public static final String QUEUE_CATALOG_PROJECTION = "catalog-projection.queue";
    public static final String QUEUE_CATALOG_PROJECTION_DLQ = "catalog-projection.dlq";
    public static final String QUEUE_SHOPIFY_SYNC = "shopify-sync.queue";
    public static final String QUEUE_SHOPIFY_SYNC_DLQ = "shopify-sync.dlq";

    @Bean
    public TopicExchange pilotEventsExchange() {
        return ExchangeBuilder
            .topicExchange(EXCHANGE_PILOT_EVENTS)
            .durable(true)
            .build();
    }

    @Bean
    public TopicExchange pilotEventsDlxExchange() {
        return ExchangeBuilder
            .topicExchange(EXCHANGE_PILOT_EVENTS_DLX)
            .durable(true)
            .build();
    }

    // Catalog Projection Queue with DLQ (aligned with Effect-TS topology)
    @Bean
    public Queue catalogProjectionQueue() {
        return QueueBuilder
            .durable(QUEUE_CATALOG_PROJECTION)
            .withArgument("x-dead-letter-exchange", EXCHANGE_PILOT_EVENTS_DLX)
            .withArgument("x-dead-letter-routing-key", ROUTING_KEY_PRODUCT_PUBLISHED)
            .build();
    }

    @Bean
    public Queue catalogProjectionDlq() {
        return QueueBuilder.durable(QUEUE_CATALOG_PROJECTION_DLQ).build();
    }

    @Bean
    public Binding catalogProjectionBinding(@NonNull Queue catalogProjectionQueue, @NonNull TopicExchange pilotEventsExchange) {
        return BindingBuilder
            .bind(catalogProjectionQueue)
            .to(pilotEventsExchange)
            .with(ROUTING_KEY_PRODUCT_PUBLISHED);
    }

    @Bean
    public Binding catalogProjectionDlqBinding(@NonNull Queue catalogProjectionDlq, @NonNull TopicExchange pilotEventsDlxExchange) {
        return BindingBuilder
            .bind(catalogProjectionDlq)
            .to(pilotEventsDlxExchange)
            .with(ROUTING_KEY_PRODUCT_PUBLISHED);
    }

    // Shopify Sync Queue with DLQ (aligned with Effect-TS topology)
    @Bean
    public Queue shopifySyncQueue() {
        return QueueBuilder
            .durable(QUEUE_SHOPIFY_SYNC)
            .withArgument("x-dead-letter-exchange", EXCHANGE_PILOT_EVENTS_DLX)
            .withArgument("x-dead-letter-routing-key", ROUTING_KEY_PRODUCT_PUBLISHED)
            .build();
    }

    @Bean
    public Queue shopifySyncDlq() {
        return QueueBuilder.durable(QUEUE_SHOPIFY_SYNC_DLQ).build();
    }

    @Bean
    public Binding shopifySyncBinding(@NonNull Queue shopifySyncQueue, @NonNull TopicExchange pilotEventsExchange) {
        return BindingBuilder
            .bind(shopifySyncQueue)
            .to(pilotEventsExchange)
            .with(ROUTING_KEY_PRODUCT_PUBLISHED);
    }

    @Bean
    public Binding shopifySyncDlqBinding(@NonNull Queue shopifySyncDlq, @NonNull TopicExchange pilotEventsDlxExchange) {
        return BindingBuilder
            .bind(shopifySyncDlq)
            .to(pilotEventsDlxExchange)
            .with(ROUTING_KEY_PRODUCT_PUBLISHED);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(
        @NonNull ConnectionFactory connectionFactory,
        @NonNull Jackson2JsonMessageConverter messageConverter
    ) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(messageConverter);
        return rabbitTemplate;
    }

    @Bean
    public Jackson2JsonMessageConverter jackson2JsonMessageConverter() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        return new Jackson2JsonMessageConverter(mapper);
    }
}
