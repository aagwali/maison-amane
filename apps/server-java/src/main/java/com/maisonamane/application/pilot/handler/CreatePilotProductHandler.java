package com.maisonamane.application.pilot.handler;

import com.maisonamane.application.pilot.command.CreatePilotProductCommand;
import com.maisonamane.application.pilot.validation.ProductDataValidator;
import com.maisonamane.application.pilot.validation.ValidatedProductData;
import com.maisonamane.domain.pilot.aggregate.PilotProduct;
import com.maisonamane.domain.pilot.enums.ProductStatus;
import com.maisonamane.domain.pilot.error.PilotProductError;
import com.maisonamane.domain.pilot.error.PilotProductError.PersistenceError;
import com.maisonamane.domain.pilot.event.PilotProductPublished;
import com.maisonamane.port.driven.repository.PilotProductRepository;
import com.maisonamane.port.driven.service.Clock;
import com.maisonamane.port.driven.service.EventPublisher;
import com.maisonamane.port.driven.service.IdGenerator;
import io.vavr.control.Either;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Handler for CreatePilotProductCommand.
 * Maps Effect-TS Effect.gen handler to Java @Service with flatMap chains.
 *
 * Effect.Effect<T, E, R> → Either<E, T> with constructor-injected dependencies
 * yield* sequencing → .flatMap() chains
 */
@Service
public class CreatePilotProductHandler {

    private static final Logger log = LoggerFactory.getLogger(CreatePilotProductHandler.class);

    private final PilotProductRepository repository;
    private final IdGenerator idGenerator;
    private final Clock clock;
    private final EventPublisher eventPublisher;

    public CreatePilotProductHandler(
            PilotProductRepository repository,
            IdGenerator idGenerator,
            Clock clock,
            EventPublisher eventPublisher) {
        this.repository = repository;
        this.idGenerator = idGenerator;
        this.clock = clock;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Handle the create pilot product command.
     *
     * Railway-oriented programming with Either:
     * 1. Validate product data
     * 2. Create aggregate
     * 3. Save to repository
     * 4. Publish event if PUBLISHED
     */
    public Either<PilotProductError, PilotProduct> handle(CreatePilotProductCommand command) {
        return ProductDataValidator.validate(command.data())
                .mapLeft(err -> (PilotProductError) err)
                .flatMap(this::createAggregate)
                .flatMap(this::saveProduct)
                .peek(product -> {
                    if (product.status() == ProductStatus.PUBLISHED) {
                        emitEvent(product, command);
                    }
                });
    }

    private Either<PilotProductError, PilotProduct> createAggregate(ValidatedProductData validated) {
        var productId = idGenerator.generateProductId();
        var now = clock.now();

        var product = PilotProduct.create(
                productId,
                validated.label(),
                validated.type(),
                validated.category(),
                validated.description(),
                validated.priceRange(),
                validated.variants(),
                validated.views(),
                validated.status(),
                now);

        return Either.right(product);
    }

    private Either<PilotProductError, PilotProduct> saveProduct(PilotProduct product) {
        return repository.save(product)
                .mapLeft(err -> PersistenceError.of(err.message(), err.cause()));
    }

    private void emitEvent(PilotProduct product, CreatePilotProductCommand command) {
        var now = clock.now();
        var event = PilotProductPublished.of(
                product,
                command.correlationId(),
                command.userId(),
                now);

        eventPublisher.publish(event)
                .peekLeft(error -> log.error(
                        "Failed to publish event, will be retried. Error: {}",
                        error.message()));
    }
}
