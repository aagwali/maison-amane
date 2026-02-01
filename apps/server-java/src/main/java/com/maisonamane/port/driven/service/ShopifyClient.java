package com.maisonamane.port.driven.service;

import com.maisonamane.domain.pilot.aggregate.PilotProduct;
import com.maisonamane.domain.pilot.valueobject.ShopifyProductId;
import io.vavr.control.Either;

/**
 * Port for Shopify API client. Maps Effect-TS Context.Tag<ShopifyClient> to Java interface.
 */
public interface ShopifyClient {

    sealed interface ShopifyError {
        String message();

        record ApiError(String message, int statusCode) implements ShopifyError {}

        record ValidationError(String message, java.util.List<String> fields) implements ShopifyError {}

        record NetworkError(String message, Throwable cause) implements ShopifyError {}
    }

    Either<ShopifyError, ShopifyProductId> syncProduct(PilotProduct product);
}
