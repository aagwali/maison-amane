# Effect-TS to Java Spring + Vavr Pattern Mapping

## Table of Contents

1. [Railway-Oriented Programming](#1-railway-oriented-programming)
2. [Dependency Injection](#2-dependency-injection)
3. [Discriminated Errors](#3-discriminated-errors)
4. [Composition & Sequencing](#4-composition--sequencing)
5. [Schema & Validation](#5-schema--validation)
6. [Value Objects & Branded Types](#6-value-objects--branded-types)
7. [Domain Events](#7-domain-events)
8. [State Machines](#8-state-machines)

---

## 1. Railway-Oriented Programming

### Effect-TS

```typescript
Effect.Effect<Success, Error, Requirements>

const save = (product: Product): Effect.Effect<Product, PersistenceError> =>
  Effect.tryPromise({
    try: () => collection.insertOne(toDocument(product)),
    catch: (e) => new PersistenceError({ cause: e }),
  })
```

### Java + Vavr

```java
Either<Error, Success>

public Either<PersistenceError, Product> save(Product product) {
    return Try.of(() -> mongoTemplate.save(toDocument(product)))
        .map(this::fromDocument)
        .toEither()
        .mapLeft(e -> new PersistenceError("Save failed", e));
}
```

### Key Operations Mapping

| Effect-TS                | Vavr                                       |
| ------------------------ | ------------------------------------------ |
| `Effect.map(fn)`         | `either.map(fn)`                           |
| `Effect.flatMap(fn)`     | `either.flatMap(fn)`                       |
| `Effect.mapError(fn)`    | `either.mapLeft(fn)`                       |
| `Effect.catchAll(fn)`    | `either.orElse(fn)` / `either.recover(fn)` |
| `Effect.succeed(value)`  | `Either.right(value)`                      |
| `Effect.fail(error)`     | `Either.left(error)`                       |
| `Effect.tryPromise(...)` | `Try.of(...).toEither()`                   |
| `Effect.all([...])`      | `Either.sequence(List.of(...))`            |
| `Effect.either`          | Already Either                             |

---

## 2. Dependency Injection

### Effect-TS (Context.Tag + Layer)

```typescript
// Port definition
export class ProductRepository extends Context.Tag('ProductRepository')<
  ProductRepository,
  ProductRepositoryService
>() {}

// Usage in handler
const handler = Effect.gen(function* () {
  const repo = yield* ProductRepository
  return yield* repo.save(product)
})

// Layer composition
const LiveLayer = Layer.mergeAll(MongoProductRepositoryLive, UuidIdGeneratorLive, SystemClockLive)

// Execution
Effect.runPromise(handler.pipe(Effect.provide(LiveLayer)))
```

### Java + Spring

```java
// Port definition (interface)
public interface ProductRepository {
    Either<PersistenceError, Product> save(Product product);
    Either<PersistenceError, Option<Product>> findById(ProductId id);
}

// Usage in handler (constructor injection)
@Service
public class CreateProductHandler {
    private final ProductRepository repository;
    private final IdGenerator idGenerator;
    private final Clock clock;

    public CreateProductHandler(
        ProductRepository repository,
        IdGenerator idGenerator,
        Clock clock
    ) {
        this.repository = repository;
        this.idGenerator = idGenerator;
        this.clock = clock;
    }

    public Either<ProductCreationError, Product> handle(CreateProductCommand cmd) {
        return validate(cmd.data())
            .flatMap(this::createAggregate)
            .flatMap(repository::save);
    }
}

// Layer composition (Spring Configuration)
@Configuration
public class RepositoryConfiguration {

    @Bean
    @Profile("!test")
    public ProductRepository productRepository(MongoTemplate mongoTemplate) {
        return new MongoProductRepository(mongoTemplate);
    }

    @Bean
    @Profile("test")
    public ProductRepository testProductRepository() {
        return new InMemoryProductRepository();
    }
}
```

---

## 3. Discriminated Errors

### Effect-TS

```typescript
export class ValidationError extends Data.TaggedError('ValidationError')<{
  readonly errors: readonly string[]
}> {}

export class PersistenceError extends Data.TaggedError('PersistenceError')<{
  readonly message: string
  readonly cause: unknown
}> {}

export type ProductCreationError = ValidationError | PersistenceError

// Pattern matching
const result = Effect.catchAll((error) => {
  switch (error._tag) {
    case 'ValidationError':
      return Effect.succeed(badRequest(error.errors))
    case 'PersistenceError':
      return Effect.succeed(internalError(error.message))
  }
})
```

### Java 21+ (Sealed + Pattern Matching)

```java
public sealed interface ProductCreationError
    permits ValidationError, PersistenceError, EventPublishError {
}

public record ValidationError(List<String> errors) implements ProductCreationError {}

public record PersistenceError(String message, Throwable cause) implements ProductCreationError {}

public record EventPublishError(DomainEvent event, Throwable cause) implements ProductCreationError {}

// Pattern matching (Java 21+)
return result.fold(
    error -> switch (error) {
        case ValidationError v -> ResponseEntity.badRequest().body(v.errors());
        case PersistenceError p -> ResponseEntity.internalServerError().body(p.message());
        case EventPublishError e -> {
            log.error("Event publish failed", e.cause());
            yield ResponseEntity.ok().build();
        }
    },
    product -> ResponseEntity.ok(toDto(product))
);
```

---

## 4. Composition & Sequencing

### Effect-TS (Effect.gen)

```typescript
export const handleProductCreation = (command: CreateProductCommand) =>
  Effect.gen(function* () {
    const validated = yield* validateProductData(command.data)
    const product = yield* createAggregate(validated)
    const repo = yield* ProductRepository
    const saved = yield* repo.save(product)

    if (saved.status === ProductStatus.PUBLISHED) {
      yield* emitEvent(saved, command)
    }

    return saved
  })
```

### Java + Vavr (flatMap chains)

```java
public Either<ProductCreationError, Product> handle(CreateProductCommand command) {
    return validateProductData(command.data())
        .flatMap(validated -> createAggregate(validated))
        .flatMap(product -> repository.save(product)
            .mapLeft(ProductCreationError::fromPersistence))
        .peek(saved -> {
            if (saved.status() == ProductStatus.PUBLISHED) {
                emitEvent(saved, command);
            }
        });
}
```

### For-Comprehension Style (Vavr)

```java
public Either<ProductCreationError, Product> handle(CreateProductCommand command) {
    return For(
        validateProductData(command.data()),
        validated -> createAggregate(validated),
        (validated, product) -> repository.save(product)
            .mapLeft(ProductCreationError::fromPersistence)
    ).yield((validated, product, saved) -> {
        if (saved.status() == ProductStatus.PUBLISHED) {
            emitEvent(saved, command);
        }
        return saved;
    });
}
```

---

## 5. Schema & Validation

### Effect-TS (Effect Schema)

```typescript
const ProductLabelSchema = S.String.pipe(S.minLength(1), S.maxLength(200), S.brand('ProductLabel'))

const validateProductData = (data: UnvalidatedData) =>
  S.decodeUnknown(ValidatedProductDataSchema)(data).pipe(
    Effect.mapError((e) => new ValidationError({ errors: formatErrors(e) }))
  )
```

### Java (Bean Validation + Custom Validator)

```java
// Value object with validation
public record ProductLabel(String value) {
    public ProductLabel {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Label cannot be blank");
        }
        if (value.length() > 200) {
            throw new IllegalArgumentException("Label max 200 chars");
        }
    }

    public static Either<ValidationError, ProductLabel> of(String value) {
        return Try.of(() -> new ProductLabel(value))
            .toEither()
            .mapLeft(e -> new ValidationError(List.of(e.getMessage())));
    }
}

// Validation service
@Component
public class ProductDataValidator {

    public Either<ValidationError, ValidatedProductData> validate(UnvalidatedProductData data) {
        return Validation.combine(
            validateLabel(data.label()),
            validateType(data.type()),
            validateCategory(data.category()),
            validateVariants(data.variants()),
            validateViews(data.views())
        ).ap(ValidatedProductData::new)
         .toEither()
         .mapLeft(errors -> new ValidationError(errors.toJavaList()));
    }

    private Validation<String, ProductLabel> validateLabel(String label) {
        return ProductLabel.of(label)
            .fold(
                err -> Validation.invalid(err.errors().head()),
                Validation::valid
            );
    }
}
```

---

## 6. Value Objects & Branded Types

### Effect-TS

```typescript
// Branded type
export const ProductIdSchema = S.String.pipe(S.brand('ProductId'))
export type ProductId = typeof ProductIdSchema.Type

// Tagged union
export const SyncStatusSchema = S.Union(
  S.TaggedStruct('NotSynced', {}),
  S.TaggedStruct('Synced', { shopifyId: S.String, syncedAt: S.Date }),
  S.TaggedStruct('SyncFailed', { error: S.String, attempts: S.Number })
)

// Constructor
export const MakeProductId = (value: string): ProductId => value as ProductId
```

### Java

```java
// Value object (replaces branded type)
public record ProductId(String value) {
    public ProductId {
        Objects.requireNonNull(value, "ProductId cannot be null");
        if (value.isBlank()) {
            throw new IllegalArgumentException("ProductId cannot be blank");
        }
    }
}

// Sealed union (replaces tagged union)
public sealed interface SyncStatus
    permits NotSynced, Synced, SyncFailed {
}

public record NotSynced() implements SyncStatus {}

public record Synced(
    ShopifyProductId shopifyId,
    Instant syncedAt
) implements SyncStatus {}

public record SyncFailed(
    String error,
    int attempts,
    Instant failedAt
) implements SyncStatus {}
```

---

## 7. Domain Events

### Effect-TS

```typescript
const PilotProductPublishedSchema = S.TaggedStruct('PilotProductPublished', {
  productId: ProductIdSchema,
  product: PilotProductSchema,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export const MakePilotProductPublished = (
  params: Omit<PilotProductPublished, '_tag'>
): PilotProductPublished =>
  Data.case<PilotProductPublished>()({ _tag: 'PilotProductPublished', ...params })
```

### Java

```java
public sealed interface DomainEvent permits ProductPublished, ProductSynced {
    CorrelationId correlationId();
    UserId userId();
    Instant timestamp();
}

public record ProductPublished(
    ProductId productId,
    Product product,
    CorrelationId correlationId,
    UserId userId,
    Instant timestamp
) implements DomainEvent {}

public record ProductSynced(
    ProductId productId,
    ShopifyProductId shopifyId,
    CorrelationId correlationId,
    UserId userId,
    Instant timestamp
) implements DomainEvent {}
```

---

## 8. State Machines

### Effect-TS

```typescript
export const SyncStatusMachine = {
  markSynced: (status: SyncStatus, shopifyId: ShopifyProductId, now: Date) =>
    Match.value(status).pipe(
      Match.tag('NotSynced', () => MakeSynced({ shopifyId, syncedAt: now })),
      Match.tag('SyncFailed', () => MakeSynced({ shopifyId, syncedAt: now })),
      Match.tag('Synced', (s) => s),
      Match.exhaustive
    ),

  markFailed: (status: SyncStatus, error: string, now: Date) =>
    Match.value(status).pipe(
      Match.tag('NotSynced', () => MakeSyncFailed({ error, attempts: 1, failedAt: now })),
      Match.tag('SyncFailed', (s) =>
        MakeSyncFailed({ error, attempts: s.attempts + 1, failedAt: now })
      ),
      Match.tag('Synced', (s) => s),
      Match.exhaustive
    ),
}
```

### Java

```java
public class SyncStatusMachine {

    public static SyncStatus markSynced(SyncStatus status, ShopifyProductId shopifyId, Instant now) {
        return switch (status) {
            case NotSynced n -> new Synced(shopifyId, now);
            case SyncFailed f -> new Synced(shopifyId, now);
            case Synced s -> s; // Already synced, no change
        };
    }

    public static SyncStatus markFailed(SyncStatus status, String error, Instant now) {
        return switch (status) {
            case NotSynced n -> new SyncFailed(error, 1, now);
            case SyncFailed f -> new SyncFailed(error, f.attempts() + 1, now);
            case Synced s -> s; // Don't overwrite success
        };
    }

    public static boolean canSync(SyncStatus status) {
        return switch (status) {
            case NotSynced n -> true;
            case SyncFailed f -> f.attempts() < MAX_RETRIES;
            case Synced s -> false;
        };
    }
}
```

---

## Quick Reference Table

| Concept           | Effect-TS                 | Java + Vavr                   |
| ----------------- | ------------------------- | ----------------------------- |
| Success/Failure   | `Effect<A, E, R>`         | `Either<E, A>`                |
| Optional          | `Option<A>`               | `Option<A>` (Vavr)            |
| Exception capture | `Effect.tryPromise`       | `Try.of().toEither()`         |
| Branded type      | `S.brand("Name")`         | `record Name(String value)`   |
| Tagged union      | `S.TaggedStruct`          | `sealed interface` + `record` |
| DI container      | `Context.Tag` + `Layer`   | Spring `@Component` + `@Bean` |
| Profiles/Env      | `Layer.provide(DevLayer)` | `@Profile("dev")`             |
| Validation        | `S.decodeUnknown`         | `Validation.combine()`        |
| Pattern match     | `Match.value().pipe()`    | `switch (sealed) {}`          |
| Immutable data    | `Data.case<T>()`          | `record`                      |
