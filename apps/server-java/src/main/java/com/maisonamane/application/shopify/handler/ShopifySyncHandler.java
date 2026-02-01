package com.maisonamane.application.shopify.handler;

import com.maisonamane.domain.pilot.aggregate.PilotProduct;
import com.maisonamane.domain.pilot.valueobject.ShopifyProductId;
import com.maisonamane.domain.pilot.valueobject.SyncStatus;
import com.maisonamane.port.driven.error.PersistenceError;
import com.maisonamane.port.driven.repository.PilotProductRepository;
import com.maisonamane.port.driven.service.Clock;
import com.maisonamane.port.driven.service.ShopifyClient;
import com.maisonamane.port.driven.service.ShopifyClient.ShopifyError;
import io.vavr.control.Either;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ShopifySyncHandler {

    private static final Logger log = LoggerFactory.getLogger(ShopifySyncHandler.class);

    private final ShopifyClient shopifyClient;
    private final PilotProductRepository repository;
    private final Clock clock;

    public ShopifySyncHandler(
            ShopifyClient shopifyClient, PilotProductRepository repository, Clock clock) {
        this.shopifyClient = shopifyClient;
        this.repository = repository;
        this.clock = clock;
    }

    public sealed interface SyncError {
        String message();

        record ShopifyFailure(String message, ShopifyError cause) implements SyncError {}

        record PersistenceFailure(String message, PersistenceError cause) implements SyncError {}

        record AlreadySynced(String message) implements SyncError {}
    }

    public Either<SyncError, PilotProduct> handle(PilotProduct product, String correlationId) {

        log.info(
                "Syncing product to Shopify - correlationId: {}, productId: {}",
                correlationId,
                product.id());

        // Check if already synced
        if (product.syncStatus().isSynced()) {
            log.info(
                    "Product already synced - correlationId: {}, productId: {}",
                    correlationId,
                    product.id());
            return Either.left(
                    new SyncError.AlreadySynced("Product " + product.id() + " is already synced"));
        }

        return shopifyClient
                .syncProduct(product)
                .mapLeft(e -> (SyncError) new SyncError.ShopifyFailure("Shopify sync failed", e))
                .flatMap(shopifyId -> updateSyncStatus(product, shopifyId, correlationId));
    }

    private Either<SyncError, PilotProduct> updateSyncStatus(
            PilotProduct product, ShopifyProductId shopifyId, String correlationId) {

        var now = clock.now();
        var synced = SyncStatus.synced(shopifyId, now);
        var updatedProduct = product.withSyncStatus(synced, now);

        return repository
                .update(updatedProduct)
                .peek(
                        p ->
                                log.info(
                                        "Product sync status updated - correlationId: {}, productId: {}, shopifyId: {}",
                                        correlationId,
                                        p.id(),
                                        shopifyId))
                .mapLeft(e -> new SyncError.PersistenceFailure("Failed to update sync status", e));
    }
}
