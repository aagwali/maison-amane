package com.maisonamane.port.driven.repository;

import com.maisonamane.domain.catalog.projection.CatalogProduct;
import com.maisonamane.domain.pilot.valueobject.ProductId;
import com.maisonamane.port.driven.error.PersistenceError;
import io.vavr.control.Either;
import io.vavr.control.Option;
import java.util.List;

/**
 * Repository interface for CatalogProduct (Read Model).
 * Maps Effect-TS Context.Tag interface to Java interface with Either returns.
 */
public interface CatalogProductRepository {

    Either<PersistenceError, CatalogProduct> upsert(CatalogProduct product);

    Either<PersistenceError, Option<CatalogProduct>> findById(ProductId id);

    Either<PersistenceError, List<CatalogProduct>> findAll();
}
