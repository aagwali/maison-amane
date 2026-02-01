package com.maisonamane.infrastructure.shopify;

import com.maisonamane.domain.pilot.aggregate.PilotProduct;
import com.maisonamane.domain.pilot.valueobject.ShopifyProductId;
import com.maisonamane.port.driven.service.ShopifyClient;
import io.vavr.control.Either;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Fake implementation of ShopifyClient for development/testing. Returns a generated Shopify
 * product ID.
 */
@Component
public class FakeShopifyClient implements ShopifyClient {

    private static final Logger log = LoggerFactory.getLogger(FakeShopifyClient.class);

    @Override
    public Either<ShopifyError, ShopifyProductId> syncProduct(PilotProduct product) {
        log.info(
                "[FAKE] Syncing product to Shopify - productId: {}, label: {}",
                product.id(),
                product.label());

        // Simulate Shopify product ID format: gid://shopify/Product/{id}
        var fakeShopifyId = "gid://shopify/Product/" + UUID.randomUUID().toString().substring(0, 8);

        log.info(
                "[FAKE] Product synced to Shopify - productId: {}, shopifyId: {}",
                product.id(),
                fakeShopifyId);

        return Either.right(ShopifyProductId.of(fakeShopifyId));
    }
}
