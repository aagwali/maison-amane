---
name: effect-to-spring-vavr
description: |
  Migrate Effect-TS projects with DDD/Hexagonal architecture to Java 21 Spring Boot + Vavr.
  Use when: (1) User wants to migrate an Effect-TS codebase to Java, (2) User asks to convert Effect patterns to Spring + Vavr, (3) User needs Java equivalent of Effect-TS DDD architecture.
  Preserves: Railway-oriented programming (Either), typed errors (sealed interfaces), DI (Spring), composition (flatMap chains), hexagonal structure.
---

# Effect-TS to Spring Boot + Vavr Migration

Migrate Effect-TS DDD/Hexagonal projects to Java 21 + Spring Boot + Vavr while preserving architectural patterns.

## Prerequisites

- Source: Effect-TS project with DDD + Hexagonal architecture
- Target: Java 21+, Spring Boot 3.2+, Vavr 0.10.4, Gradle Kotlin DSL

## Migration Workflow

### Phase 1: Analysis

1. **Identify source structure**

   ```
   Scan for:
   - domain/         → Aggregates, Value Objects, Events, Errors
   - application/    → Commands, Handlers, Validation
   - ports/          → Repository/Service interfaces
   - infrastructure/ → Adapters (MongoDB, RabbitMQ, HTTP)
   - composition/    → Layers (→ Spring @Configuration)
   ```

2. **Map bounded contexts** - List each context with its components

3. **Identify shared packages** - Cross-cutting concerns (api/, shared-kernel/)

### Phase 2: Scaffold Java Project

1. **Create Gradle structure** - See [gradle-structure.md](references/gradle-structure.md)

2. **Generate build.gradle.kts**

   ```kotlin
   plugins {
       java
       id("org.springframework.boot") version "3.2.0"
       id("io.spring.dependency-management") version "1.1.4"
   }

   java {
       sourceCompatibility = JavaVersion.VERSION_21
   }

   dependencies {
       implementation("org.springframework.boot:spring-boot-starter-web")
       implementation("org.springframework.boot:spring-boot-starter-data-mongodb")
       implementation("org.springframework.boot:spring-boot-starter-amqp")
       implementation("org.springframework.boot:spring-boot-starter-validation")
       implementation("io.vavr:vavr:0.10.4")
       implementation("io.vavr:vavr-jackson:0.10.3")

       testImplementation("org.springframework.boot:spring-boot-starter-test")
       testImplementation("org.assertj:assertj-vavr:0.4.3")
       testImplementation("org.testcontainers:mongodb:1.19.3")
   }
   ```

3. **Create package structure** mirroring source

### Phase 3: Migrate by Layer (per Bounded Context)

Order: **Domain → Ports → Application → Infrastructure → Config**

#### 3.1 Domain Layer

| Effect-TS                  | Java                                    |
| -------------------------- | --------------------------------------- |
| `S.TaggedStruct` aggregate | `record` with validation in constructor |
| `S.brand("Type")`          | Value object `record`                   |
| `S.Union(A, B, C)`         | `sealed interface` + `record`           |
| `Data.TaggedError`         | `sealed interface` for errors           |
| `Data.case<T>()`           | `record` (immutable by default)         |

**Aggregate example:**

```java
public record Product(
    ProductId id,
    ProductLabel label,
    ProductType type,
    List<Variant> variants,  // NonEmpty validated in factory
    SyncStatus syncStatus,
    Instant createdAt,
    Instant updatedAt
) {
    public Product {
        Objects.requireNonNull(id);
        Objects.requireNonNull(label);
        if (variants == null || variants.isEmpty()) {
            throw new IllegalArgumentException("At least one variant required");
        }
    }

    public static Product create(/*params*/) {
        return new Product(/*...*/);
    }
}
```

**Sealed union example:**

```java
public sealed interface SyncStatus permits NotSynced, Synced, SyncFailed {}
public record NotSynced() implements SyncStatus {}
public record Synced(ShopifyProductId shopifyId, Instant syncedAt) implements SyncStatus {}
public record SyncFailed(String error, int attempts, Instant failedAt) implements SyncStatus {}
```

#### 3.2 Ports (Interfaces)

| Effect-TS                    | Java                        |
| ---------------------------- | --------------------------- |
| `Context.Tag<Service>`       | `interface`                 |
| `Effect.Effect<T, E>` return | `Either<E, T>` return       |
| `Option.Option<T>`           | `io.vavr.control.Option<T>` |

```java
public interface ProductRepository {
    Either<PersistenceError, Product> save(Product product);
    Either<PersistenceError, Option<Product>> findById(ProductId id);
    Either<PersistenceError, Product> update(Product product);
}
```

#### 3.3 Application Layer

| Effect-TS            | Java                                 |
| -------------------- | ------------------------------------ |
| Command DTO          | `record`                             |
| `Effect.gen` handler | `@Service` class with constructor DI |
| `yield*` sequencing  | `.flatMap()` chains                  |
| Schema validation    | Bean Validation + Vavr `Validation`  |

**Handler example:**

```java
@Service
public class CreateProductHandler {
    private final ProductRepository repository;
    private final IdGenerator idGenerator;
    private final Clock clock;
    private final EventPublisher eventPublisher;

    public CreateProductHandler(/*constructor injection*/) { /*...*/ }

    public Either<ProductCreationError, Product> handle(CreateProductCommand command) {
        return validateProductData(command.data())
            .flatMap(this::createAggregate)
            .flatMap(repository::save)
            .peek(product -> {
                if (product.status() == ProductStatus.PUBLISHED) {
                    publishEvent(product, command);
                }
            });
    }
}
```

#### 3.4 Infrastructure Layer

| Effect-TS                 | Java                         |
| ------------------------- | ---------------------------- |
| `Layer.effect(Tag, impl)` | `@Repository` / `@Component` |
| MongoDB adapter           | Spring Data MongoDB          |
| RabbitMQ adapter          | Spring AMQP                  |
| HTTP handler              | `@RestController`            |

**Repository example:**

```java
@Repository
public class MongoProductRepository implements ProductRepository {
    private final MongoTemplate mongoTemplate;

    @Override
    public Either<PersistenceError, Product> save(Product product) {
        return Try.of(() -> mongoTemplate.save(toDocument(product)))
            .map(this::fromDocument)
            .toEither()
            .mapLeft(e -> new PersistenceError("Save failed", e));
    }
}
```

#### 3.5 Configuration (replaces Layers)

| Effect-TS             | Java                                  |
| --------------------- | ------------------------------------- |
| `Layer.mergeAll(...)` | `@Configuration` class                |
| Environment layers    | `@Profile("dev")`, `@Profile("test")` |
| `Layer.provide(...)`  | Spring auto-wiring                    |

```java
@Configuration
public class RepositoryConfig {
    @Bean
    @Profile("!test")
    public ProductRepository productRepository(MongoTemplate mongo) {
        return new MongoProductRepository(mongo);
    }

    @Bean
    @Profile("test")
    public ProductRepository testRepository() {
        return new InMemoryProductRepository();
    }
}
```

### Phase 4: Migrate Tests

See [testing-patterns.md](references/testing-patterns.md) for detailed patterns.

1. **Create test doubles** - InMemory repos, Fixed clock, Spy publisher
2. **Create TestConfiguration** - Wire test doubles with `@TestConfiguration`
3. **Migrate test cases** - Convert Effect.runPromise to direct handler calls

### Phase 5: Verify

1. **Compile** - `./gradlew build`
2. **Run tests** - `./gradlew test`
3. **Start application** - `./gradlew bootRun`
4. **Test endpoints** - Verify HTTP API works

## Pattern Reference

Consult [effect-to-java-patterns.md](references/effect-to-java-patterns.md) for:

- Railway-oriented programming with Either
- Dependency injection mapping
- Error handling patterns
- Composition and sequencing
- Validation patterns

## File Naming Conventions

| Effect-TS                     | Java                                     |
| ----------------------------- | ---------------------------------------- |
| `aggregate.ts`                | `Product.java` (record)                  |
| `{name}.repository.ts` (port) | `ProductRepository.java` (interface)     |
| `{name}.repository.ts` (impl) | `MongoProductRepository.java`            |
| `create-{entity}.command.ts`  | `CreateProductCommand.java`              |
| `create-{entity}.handler.ts`  | `CreateProductHandler.java`              |
| `{context}.layer.ts`          | `{Context}Config.java`                   |
| `events.ts`                   | `event/` package with one file per event |

## Quick Checklist

Per bounded context:

- [ ] Domain: aggregates as records
- [ ] Domain: value objects as records
- [ ] Domain: events as records
- [ ] Domain: errors as sealed interface
- [ ] Domain: services as classes
- [ ] Ports: interfaces with Either returns
- [ ] Application: commands as records
- [ ] Application: handlers as @Service
- [ ] Application: validation with Vavr Validation
- [ ] Infrastructure: MongoDB @Repository
- [ ] Infrastructure: RabbitMQ @Component
- [ ] Infrastructure: HTTP @RestController
- [ ] Config: @Configuration with @Profile
- [ ] Tests: test doubles
- [ ] Tests: @SpringBootTest with TestConfiguration
