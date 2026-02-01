package com.maisonamane.configuration;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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

    @Bean
    public RabbitTemplate rabbitTemplate(
        ConnectionFactory connectionFactory,
        Jackson2JsonMessageConverter messageConverter
    ) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(messageConverter);
        return rabbitTemplate;
    }

    @Bean
    public Jackson2JsonMessageConverter jackson2JsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
