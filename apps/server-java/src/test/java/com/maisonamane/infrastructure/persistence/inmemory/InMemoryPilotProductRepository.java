package com.maisonamane.infrastructure.persistence.inmemory;

import com.maisonamane.domain.pilot.aggregate.PilotProduct;
import com.maisonamane.domain.pilot.valueobject.ProductId;
import com.maisonamane.port.driven.error.PersistenceError;
import com.maisonamane.port.driven.repository.PilotProductRepository;
import io.vavr.control.Either;
import io.vavr.control.Option;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory implementation of PilotProductRepository for testing.
 * Maps Effect-TS InMemoryPilotProductRepository to Java.
 */
public class InMemoryPilotProductRepository implements PilotProductRepository {

    private final ConcurrentHashMap<String, PilotProduct> storage = new ConcurrentHashMap<>();

    @Override
    public Either<PersistenceError, PilotProduct> save(PilotProduct product) {
        storage.put(product.id().value(), product);
        return Either.right(product);
    }

    @Override
    public Either<PersistenceError, Option<PilotProduct>> findById(ProductId id) {
        return Either.right(Option.of(storage.get(id.value())));
    }

    @Override
    public Either<PersistenceError, PilotProduct> update(PilotProduct product) {
        storage.put(product.id().value(), product);
        return Either.right(product);
    }

    public void clear() {
        storage.clear();
    }

    public int size() {
        return storage.size();
    }
}
