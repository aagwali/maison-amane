# Maison Amane Server (Java/Spring Boot)

Migration du serveur Effect-TS vers Java 21 + Spring Boot 3.2 + Vavr, en préservant l'architecture DDD et Hexagonale.

## Stack Technique

- **Java 21** - Dernière LTS avec Records, Sealed Interfaces, Pattern Matching
- **Spring Boot 3.2** - Framework d'application
- **Vavr 0.10.4** - Programmation fonctionnelle (Either, Option, Try)
- **MongoDB** - Base de données NoSQL
- **RabbitMQ** - Message broker
- **Gradle** - Build tool

## Architecture

Le projet suit les mêmes principes que la version Effect-TS :

```
Domain Layer (DDD)
    ↕
Ports (Interfaces)
    ↕
Application Layer (CQRS handlers, validation)
    ↕
Infrastructure Layer (MongoDB, RabbitMQ, HTTP)
    ↕
Configuration Layer (Spring @Configuration)
```

### Structure du Projet

```
src/main/java/com/maisonamane/
├── domain/
│   ├── pilot/
│   │   ├── aggregate/          # PilotProduct aggregate root
│   │   ├── entity/             # ProductVariant (sealed interface)
│   │   ├── enums/              # ProductType, Size, Status, etc.
│   │   ├── valueobject/        # ProductId, ProductLabel, SyncStatus, etc.
│   │   ├── event/              # PilotProductPublished, PilotProductSynced
│   │   ├── error/              # PilotProductError (sealed interface)
│   │   └── service/            # SyncStatusMachine
│   ├── catalog/
│   │   ├── projection/         # CatalogProduct (read model)
│   │   └── event/              # CatalogProductProjected
│   └── shared/                 # CorrelationId, UserId
├── port/
│   └── driven/
│       ├── repository/         # PilotProductRepository, CatalogProductRepository
│       ├── service/            # Clock, EventPublisher, IdGenerator
│       └── error/              # PersistenceError, EventPublishError
├── application/
│   └── pilot/
│       ├── command/            # CreatePilotProductCommand, UnvalidatedProductData
│       ├── handler/            # CreatePilotProductHandler
│       └── validation/         # ProductDataValidator, ValidatedProductData
├── infrastructure/
│   ├── persistence/
│   │   └── mongodb/            # MongoPilotProductRepository, mappers
│   ├── messaging/
│   │   └── rabbitmq/           # RabbitMQEventPublisher
│   └── service/                # UuidIdGenerator, SystemClock
└── configuration/              # MongoConfiguration, RabbitMQConfiguration
```

## Patterns de Migration

### Effect-TS → Java

| Pattern Effect-TS  | Pattern Java                              |
| ------------------ | ----------------------------------------- |
| `S.TaggedStruct`   | `record`                                  |
| `S.Union(A, B)`    | `sealed interface` + records              |
| `Data.TaggedError` | `sealed interface`                        |
| `S.brand("Type")`  | Value object `record`                     |
| `Effect<T, E>`     | `Either<E, T>` (Vavr)                     |
| `Option<T>`        | `Option<T>` (Vavr)                        |
| `Context.Tag`      | Spring interface                          |
| `Layer.effect`     | `@Repository` / `@Service` / `@Component` |
| `Effect.gen`       | `.flatMap()` chains                       |

### Exemples de Code

#### Value Object avec Validation

**Effect-TS:**

```typescript
export const ProductLabelSchema = S.Trim.pipe(
  S.minLength(1),
  S.maxLength(255),
  S.brand('ProductLabel')
)
```

**Java:**

```java
public record ProductLabel(String value) {
    private static final int MAX_LENGTH = 255;

    public ProductLabel {
        Objects.requireNonNull(value);
        String trimmed = value.trim();
        if (trimmed.isEmpty() || trimmed.length() > MAX_LENGTH) {
            throw new IllegalArgumentException("Invalid label");
        }
    }
}
```

#### Sealed Interface (Union Type)

**Effect-TS:**

```typescript
export const SyncStatusSchema = S.Union(NotSyncedSchema, SyncedSchema, SyncFailedSchema)
```

**Java:**

```java
public sealed interface SyncStatus
    permits NotSynced, Synced, SyncFailed {

    record NotSynced() implements SyncStatus {}
    record Synced(ShopifyProductId id, Instant at) implements SyncStatus {}
    record SyncFailed(SyncError error, Instant at, int attempts) implements SyncStatus {}
}
```

#### Railway-Oriented Programming

**Effect-TS:**

```typescript
export const handlePilotProductCreation = (command) =>
  Effect.gen(function* () {
    const validated = yield* validateProductData(command.data)
    const product = yield* createAggregate(validated)
    const savedProduct = yield* repo.save(product)
    return savedProduct
  })
```

**Java:**

```java
public Either<PilotProductError, PilotProduct> handle(CreatePilotProductCommand command) {
    return ProductDataValidator.validate(command.data())
        .flatMap(this::createAggregate)
        .flatMap(this::saveProduct)
        .peek(product -> {
            if (product.status() == ProductStatus.PUBLISHED) {
                emitEvent(product, command);
            }
        });
}
```

#### Dependency Injection

**Effect-TS:**

```typescript
export const MongodbPilotProductRepositoryLive = Layer.effect(
  PilotProductRepository,
  Effect.map(MongoDatabase, (db) => createRepository(db))
)
```

**Java:**

```java
@Repository
public class MongoPilotProductRepository implements PilotProductRepository {

    private final MongoTemplate mongoTemplate;

    public MongoPilotProductRepository(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Either<PersistenceError, PilotProduct> save(PilotProduct product) {
        return Try.of(() -> {
                PilotProductDocument doc = PilotProductMapper.toDocument(product);
                mongoTemplate.insert(doc);
                return product;
            })
            .toEither()
            .mapLeft(e -> PersistenceError.of("Save failed", e));
    }
}
```

## Commandes

### Build

```bash
# Compiler le projet
./gradlew build

# Compiler sans les tests
./gradlew build -x test

# Nettoyer et recompiler
./gradlew clean build
```

### Tests

```bash
# Exécuter tous les tests
./gradlew test

# Exécuter les tests avec rapport de couverture
./gradlew test jacocoTestReport

# Exécuter un test spécifique
./gradlew test --tests CreatePilotProductHandlerTest
```

### Lancement

```bash
# Lancer l'application
./gradlew bootRun

# Ou avec le JAR
./gradlew bootJar
java -jar build/libs/maison-amane-server-0.0.1-SNAPSHOT.jar
```

## Configuration

Fichier `application.yml` :

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://localhost:27017/maison-amane
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest

server:
  port: 3002
```

## Tests

Les test doubles sont fournis dans `src/test/java/com/maisonamane/testutil/` :

- **InMemoryPilotProductRepository** - Repository en mémoire
- **FixedClock** - Horloge fixe pour tests déterministes
- **DeterministicIdGenerator** - Générateur d'IDs séquentiels
- **SpyEventPublisher** - Capture les événements publiés

Exemple d'utilisation :

```java
@BeforeEach
void setUp() {
    repository = new InMemoryPilotProductRepository();
    idGenerator = new DeterministicIdGenerator();
    clock = FixedClock.at("2024-01-15T10:00:00Z");
    eventPublisher = new SpyEventPublisher();

    handler = new CreatePilotProductHandler(
        repository, idGenerator, clock, eventPublisher
    );
}

@Test
void shouldCreateProduct() {
    // Given
    var command = createCommand();

    // When
    var result = handler.handle(command);

    // Then
    assertThat(result.isRight()).isTrue();
    assertThat(eventPublisher.getEventCount()).isEqualTo(1);
}
```

## Différences Notables

### Validation

**Effect-TS** utilise Schema validation avec Effect :

```typescript
S.decodeUnknown(ProductDataSchema)(data)
```

**Java** utilise Vavr Validation :

```java
Validation.combine(
    validateLabel(data.label()),
    validateType(data.type()),
    ...
).ap(ValidatedProductData::new)
```

### Pattern Matching

Java 21 apporte le pattern matching pour les sealed types :

```java
return switch (status) {
    case NotSynced ignored -> handleNotSynced();
    case Synced synced -> handleSynced(synced);
    case SyncFailed failed -> handleFailed(failed);
};
```

### Immutabilité

Les `record` Java sont immuables par défaut, équivalent à `Data.case()` :

```java
// Création
var product = new PilotProduct(id, label, ...);

// Modification (retourne une nouvelle instance)
var updated = product.withStatus(ProductStatus.PUBLISHED, clock.now());
```

## Prochaines Étapes

1. Migrer les HTTP controllers (routes API)
2. Migrer les consumers (catalog-projection, shopify-sync)
3. Ajouter les tests d'intégration avec Testcontainers
4. Configurer les logs structurés (Logback + Logstash)
5. Ajouter OpenAPI documentation

## Ressources

- [Vavr Documentation](https://www.vavr.io/)
- [Spring Boot Reference](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Java Records](https://openjdk.org/jeps/395)
- [Sealed Classes](https://openjdk.org/jeps/409)
