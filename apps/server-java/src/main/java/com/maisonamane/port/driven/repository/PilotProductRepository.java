package com.maisonamane.port.driven.repository;

import com.maisonamane.domain.pilot.aggregate.PilotProduct;
import com.maisonamane.domain.pilot.valueobject.ProductId;
import com.maisonamane.port.driven.error.PersistenceError;
import io.vavr.control.Either;
import io.vavr.control.Option;

/**
 * Repository interface for PilotProduct (Write Model).
 * Maps Effect-TS Context.Tag interface to Java interface with Either returns.
 *
 * Effect<T, E> → Either<E, T>
 * Option<T> → io.vavr.control.Option<T>
 */
public interface PilotProductRepository {

    Either<PersistenceError, PilotProduct> save(PilotProduct product);

    Either<PersistenceError, Option<PilotProduct>> findById(ProductId id);

    Either<PersistenceError, PilotProduct> update(PilotProduct product);
}
