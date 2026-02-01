package com.maisonamane.infrastructure.persistence.mongodb;

import com.maisonamane.domain.catalog.projection.CatalogProduct;
import com.maisonamane.domain.pilot.valueobject.ProductId;
import com.maisonamane.infrastructure.persistence.mongodb.document.CatalogProductDocument;
import com.maisonamane.infrastructure.persistence.mongodb.mapper.CatalogProductMapper;
import com.maisonamane.port.driven.error.PersistenceError;
import com.maisonamane.port.driven.repository.CatalogProductRepository;
import io.vavr.control.Either;
import io.vavr.control.Option;
import io.vavr.control.Try;
import java.util.List;
import java.util.Objects;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

@Repository
public class MongoCatalogProductRepository implements CatalogProductRepository {

    private final MongoTemplate mongoTemplate;
    private final CatalogProductMapper mapper;

    public MongoCatalogProductRepository(@NonNull MongoTemplate mongoTemplate, @NonNull CatalogProductMapper mapper) {
        this.mongoTemplate = mongoTemplate;
        this.mapper = mapper;
    }

    @Override
    @SuppressWarnings("null")
    public Either<PersistenceError, CatalogProduct> upsert(CatalogProduct product) {
        return Try.of(() -> {
                    CatalogProductDocument doc = Objects.requireNonNull(
                        mongoTemplate.save(mapper.toDocument(product)),
                        "MongoDB save returned null"
                    );
                    return mapper.toDomain(doc);
                })
                .toEither()
                .mapLeft(e -> new PersistenceError("Failed to upsert catalog product", e));
    }

    @Override
    @SuppressWarnings("null")
    public Either<PersistenceError, Option<CatalogProduct>> findById(ProductId id) {
        return Try.of(
                        () -> {
                            var query = Query.query(Criteria.where("_id").is(id.value()));
                            CatalogProductDocument doc = mongoTemplate.findOne(query, CatalogProductDocument.class);
                            return Option.of(doc).map(mapper::toDomain);
                        })
                .toEither()
                .mapLeft(e -> new PersistenceError("Failed to find catalog product", e));
    }

    @Override
    @SuppressWarnings("null")
    public Either<PersistenceError, List<CatalogProduct>> findAll() {
        return Try.of(
                        () -> {
                            var docs = mongoTemplate.findAll(CatalogProductDocument.class);
                            return docs.stream().map(mapper::toDomain).toList();
                        })
                .toEither()
                .mapLeft(e -> new PersistenceError("Failed to find all catalog products", e));
    }
}
