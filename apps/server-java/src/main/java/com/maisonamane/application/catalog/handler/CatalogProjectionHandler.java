package com.maisonamane.application.catalog.handler;

import com.maisonamane.application.catalog.mapper.CatalogProjectionMapper;
import com.maisonamane.domain.catalog.projection.CatalogProduct;
import com.maisonamane.domain.pilot.aggregate.PilotProduct;
import com.maisonamane.port.driven.error.PersistenceError;
import com.maisonamane.port.driven.repository.CatalogProductRepository;
import io.vavr.control.Either;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class CatalogProjectionHandler {

    private static final Logger log = LoggerFactory.getLogger(CatalogProjectionHandler.class);

    private final CatalogProductRepository repository;
    private final CatalogProjectionMapper mapper;

    public CatalogProjectionHandler(
            CatalogProductRepository repository, CatalogProjectionMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public Either<PersistenceError, CatalogProduct> handle(
            PilotProduct product, String correlationId, Instant timestamp) {

        log.info(
                "Projecting product to catalog - correlationId: {}, productId: {}",
                correlationId,
                product.id());

        var catalogProduct = mapper.projectToCatalog(product, timestamp);

        return repository
                .upsert(catalogProduct)
                .peek(
                        p ->
                                log.info(
                                        "Product projected to catalog - correlationId: {}, productId: {}",
                                        correlationId,
                                        p.id()));
    }
}
