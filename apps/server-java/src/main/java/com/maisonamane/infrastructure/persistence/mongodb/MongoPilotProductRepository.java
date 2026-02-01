package com.maisonamane.infrastructure.persistence.mongodb;

import com.maisonamane.domain.pilot.aggregate.PilotProduct;
import com.maisonamane.domain.pilot.valueobject.ProductId;
import com.maisonamane.infrastructure.persistence.mongodb.document.PilotProductDocument;
import com.maisonamane.infrastructure.persistence.mongodb.mapper.PilotProductMapper;
import com.maisonamane.port.driven.error.PersistenceError;
import com.maisonamane.port.driven.repository.PilotProductRepository;
import io.vavr.control.Either;
import io.vavr.control.Option;
import io.vavr.control.Try;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

/**
 * MongoDB implementation of PilotProductRepository.
 * Maps Effect-TS Layer.effect pattern to Spring @Repository with constructor injection.
 */
@Repository
public class MongoPilotProductRepository implements PilotProductRepository {

    private static final String COLLECTION_NAME = "pilot_products";

    private final MongoTemplate mongoTemplate;

    public MongoPilotProductRepository(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Either<PersistenceError, PilotProduct> save(PilotProduct product) {
        return Try.of(() -> {
                PilotProductDocument doc = PilotProductMapper.toDocument(product);
                mongoTemplate.insert(doc, COLLECTION_NAME);
                return product;
            })
            .toEither()
            .mapLeft(e -> PersistenceError.of("Failed to save product", e));
    }

    @Override
    public Either<PersistenceError, Option<PilotProduct>> findById(ProductId id) {
        return Try.of(() -> {
                Query query = Query.query(Criteria.where("_id").is(id.value()));
                PilotProductDocument doc = mongoTemplate.findOne(query, PilotProductDocument.class, COLLECTION_NAME);
                return Option.of(doc).map(PilotProductMapper::fromDocument);
            })
            .toEither()
            .mapLeft(e -> PersistenceError.of("Failed to find product by ID", e));
    }

    @Override
    public Either<PersistenceError, PilotProduct> update(PilotProduct product) {
        return Try.of(() -> {
                PilotProductDocument doc = PilotProductMapper.toDocument(product);
                Query query = Query.query(Criteria.where("_id").is(product.id().value()));
                mongoTemplate.findAndReplace(query, doc, COLLECTION_NAME);
                return product;
            })
            .toEither()
            .mapLeft(e -> PersistenceError.of("Failed to update product", e));
    }
}
