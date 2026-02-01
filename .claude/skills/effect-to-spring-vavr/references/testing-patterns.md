# Testing Patterns: Effect-TS to Spring + Vavr

## Table of Contents

1. [Test Layer Pattern](#1-test-layer-pattern)
2. [Deterministic Test Doubles](#2-deterministic-test-doubles)
3. [Integration Tests](#3-integration-tests)
4. [Unit Tests](#4-unit-tests)

---

## 1. Test Layer Pattern

### Effect-TS (TestLayer)

```typescript
// test-utils/test-layer.ts
export const TestLayer = Layer.mergeAll(
  InMemoryProductRepositoryLive,
  DeterministicIdGeneratorLive,
  FixedClockLive,
  SpyEventPublisherLive
)

export const provideTestLayer = () => {
  const eventSpy = createEventSpy()
  return {
    layer: TestLayer,
    eventSpy,
  }
}

// Usage in test
const testCtx = provideTestLayer()
const result = await Effect.runPromise(handler(command).pipe(Effect.provide(testCtx.layer)))
```

### Spring (Test Configuration)

```java
// testutil/TestConfiguration.java
@TestConfiguration
public class TestConfiguration {

    @Bean
    @Primary
    public ProductRepository testProductRepository() {
        return new InMemoryProductRepository();
    }

    @Bean
    @Primary
    public IdGenerator testIdGenerator() {
        return new DeterministicIdGenerator();
    }

    @Bean
    @Primary
    public Clock testClock() {
        return new FixedClock(TEST_DATE);
    }

    @Bean
    @Primary
    public EventPublisher testEventPublisher() {
        return new SpyEventPublisher();
    }
}

// Usage in test
@SpringBootTest
@Import(TestConfiguration.class)
class CreateProductHandlerTest {

    @Autowired
    private CreateProductHandler handler;

    @Autowired
    private SpyEventPublisher eventSpy;

    @BeforeEach
    void setUp() {
        eventSpy.clear();
    }

    @Test
    void createsProductWithDeterministicId() {
        var command = buildCommand();
        var result = handler.handle(command);

        assertThat(result.isRight()).isTrue();
        assertThat(result.get().id().value()).isEqualTo("test-product-1");
    }
}
```

---

## 2. Deterministic Test Doubles

### Deterministic ID Generator

**Effect-TS:**

```typescript
export const createDeterministicIdGenerator = (prefix = 'test') => {
  let counter = 0
  return {
    generateProductId: () => Effect.succeed(`${prefix}-product-${++counter}` as ProductId),
    generateCorrelationId: () =>
      Effect.succeed(`${prefix}-correlation-${++counter}` as CorrelationId),
  }
}
```

**Java:**

```java
public class DeterministicIdGenerator implements IdGenerator {
    private final String prefix;
    private final AtomicInteger counter = new AtomicInteger(0);

    public DeterministicIdGenerator() {
        this("test");
    }

    public DeterministicIdGenerator(String prefix) {
        this.prefix = prefix;
    }

    @Override
    public ProductId generateProductId() {
        return new ProductId(prefix + "-product-" + counter.incrementAndGet());
    }

    @Override
    public CorrelationId generateCorrelationId() {
        return new CorrelationId(prefix + "-correlation-" + counter.incrementAndGet());
    }

    public void reset() {
        counter.set(0);
    }
}
```

### Fixed Clock

**Effect-TS:**

```typescript
export const TEST_DATE = new Date('2024-01-15T10:00:00.000Z')

export const FixedClockLive = Layer.succeed(Clock, {
  now: () => Effect.succeed(TEST_DATE),
})
```

**Java:**

```java
public class FixedClock implements Clock {
    public static final Instant TEST_INSTANT = Instant.parse("2024-01-15T10:00:00.000Z");

    private final Instant fixedInstant;

    public FixedClock() {
        this(TEST_INSTANT);
    }

    public FixedClock(Instant fixedInstant) {
        this.fixedInstant = fixedInstant;
    }

    @Override
    public Instant now() {
        return fixedInstant;
    }
}
```

### Spy Event Publisher

**Effect-TS:**

```typescript
export const createEventSpy = () => {
  const events: DomainEvent[] = []
  return {
    publisher: {
      publish: (event: DomainEvent) => {
        events.push(event)
        return Effect.succeed(undefined)
      },
    },
    get emittedEvents() {
      return [...events]
    },
    get lastEvent() {
      return events[events.length - 1]
    },
    hasEmitted: (tag: string) => events.some((e) => e._tag === tag),
    clear: () => {
      events.length = 0
    },
  }
}
```

**Java:**

```java
public class SpyEventPublisher implements EventPublisher {
    private final List<DomainEvent> events = new CopyOnWriteArrayList<>();

    @Override
    public Either<EventPublishError, Void> publish(DomainEvent event) {
        events.add(event);
        return Either.right(null);
    }

    public List<DomainEvent> emittedEvents() {
        return List.copyOf(events);
    }

    public Option<DomainEvent> lastEvent() {
        return events.isEmpty()
            ? Option.none()
            : Option.some(events.get(events.size() - 1));
    }

    public boolean hasEmitted(Class<? extends DomainEvent> eventType) {
        return events.stream().anyMatch(eventType::isInstance);
    }

    public <T extends DomainEvent> Option<T> findEvent(Class<T> eventType) {
        return Option.ofOptional(
            events.stream()
                .filter(eventType::isInstance)
                .map(eventType::cast)
                .findFirst()
        );
    }

    public void clear() {
        events.clear();
    }
}
```

### In-Memory Repository

**Effect-TS:**

```typescript
export const createInMemoryRepository = () => {
  const store = new Map<string, Product>()
  return {
    save: (product: Product) => {
      store.set(product.id, product)
      return Effect.succeed(product)
    },
    findById: (id: ProductId) => Effect.succeed(Option.fromNullable(store.get(id))),
    clear: () => store.clear(),
  }
}
```

**Java:**

```java
public class InMemoryProductRepository implements ProductRepository {
    private final Map<ProductId, Product> store = new ConcurrentHashMap<>();

    @Override
    public Either<PersistenceError, Product> save(Product product) {
        store.put(product.id(), product);
        return Either.right(product);
    }

    @Override
    public Either<PersistenceError, Option<Product>> findById(ProductId id) {
        return Either.right(Option.of(store.get(id)));
    }

    @Override
    public Either<PersistenceError, Product> update(Product product) {
        if (!store.containsKey(product.id())) {
            return Either.left(new PersistenceError("Product not found: " + product.id()));
        }
        store.put(product.id(), product);
        return Either.right(product);
    }

    public void clear() {
        store.clear();
    }

    public int size() {
        return store.size();
    }
}
```

---

## 3. Integration Tests

### Handler Test

**Effect-TS:**

```typescript
describe('handlePilotProductCreation', () => {
  let testCtx: ReturnType<typeof provideTestLayer>

  beforeEach(() => {
    testCtx = provideTestLayer()
  })

  it('creates a product with deterministic ID', async () => {
    const command = buildCommand()
    const result = await Effect.runPromise(
      handlePilotProductCreation(command).pipe(Effect.provide(testCtx.layer))
    )
    expect(result.id).toBe('test-product-1')
  })

  it('emits event for PUBLISHED status', async () => {
    const command = buildCommand({ status: ProductStatus.PUBLISHED })
    await Effect.runPromise(handlePilotProductCreation(command).pipe(Effect.provide(testCtx.layer)))
    expect(testCtx.eventSpy.hasEmitted('PilotProductPublished')).toBe(true)
  })
})
```

**Java:**

```java
@SpringBootTest
@Import(TestConfiguration.class)
class CreateProductHandlerTest {

    @Autowired
    private CreateProductHandler handler;

    @Autowired
    private SpyEventPublisher eventSpy;

    @Autowired
    private InMemoryProductRepository repository;

    @BeforeEach
    void setUp() {
        eventSpy.clear();
        repository.clear();
    }

    @Test
    void createsProductWithDeterministicId() {
        var command = buildCommand();

        var result = handler.handle(command);

        assertThat(result.isRight()).isTrue();
        assertThat(result.get().id().value()).isEqualTo("test-product-1");
    }

    @Test
    void emitsEventForPublishedStatus() {
        var command = buildCommand(ProductStatus.PUBLISHED);

        handler.handle(command);

        assertThat(eventSpy.hasEmitted(ProductPublished.class)).isTrue();
        var event = eventSpy.findEvent(ProductPublished.class);
        assertThat(event.isDefined()).isTrue();
        assertThat(event.get().productId().value()).isEqualTo("test-product-1");
    }

    @Test
    void doesNotEmitEventForDraftStatus() {
        var command = buildCommand(ProductStatus.DRAFT);

        handler.handle(command);

        assertThat(eventSpy.emittedEvents()).isEmpty();
    }

    @Test
    void propagatesValidationError() {
        var command = buildCommand(data -> data.withLabel("   ")); // blank

        var result = handler.handle(command);

        assertThat(result.isLeft()).isTrue();
        assertThat(result.getLeft()).isInstanceOf(ValidationError.class);
    }

    private CreateProductCommand buildCommand() {
        return buildCommand(ProductStatus.DRAFT);
    }

    private CreateProductCommand buildCommand(ProductStatus status) {
        return new CreateProductCommand(
            new UnvalidatedProductData(
                "Test Product",
                "TAPIS",
                "RUNNER",
                "Description",
                "PREMIUM",
                List.of(new UnvalidatedVariant("REGULAR", null, null)),
                List.of(
                    new UnvalidatedView("FRONT", "https://example.com/front.jpg"),
                    new UnvalidatedView("DETAIL", "https://example.com/detail.jpg")
                ),
                status.name()
            ),
            new CorrelationId("test-correlation"),
            new UserId("test-user"),
            FixedClock.TEST_INSTANT
        );
    }
}
```

---

## 4. Unit Tests

### Domain Service Test

**Effect-TS:**

```typescript
describe('SyncStatusMachine', () => {
  const now = new Date()
  const shopifyId = 'gid://shopify/Product/123' as ShopifyProductId

  it('transitions NotSynced to Synced', () => {
    const status = MakeNotSynced()
    const result = SyncStatusMachine.markSynced(status, shopifyId, now)
    expect(result._tag).toBe('Synced')
  })

  it('increments attempts on failure', () => {
    const status = MakeSyncFailed({ error: 'API error', attempts: 2, failedAt: now })
    const result = SyncStatusMachine.markFailed(status, 'New error', now)
    expect(result._tag).toBe('SyncFailed')
    expect((result as SyncFailed).attempts).toBe(3)
  })
})
```

**Java:**

```java
class SyncStatusMachineTest {

    private static final Instant NOW = Instant.now();
    private static final ShopifyProductId SHOPIFY_ID = new ShopifyProductId("gid://shopify/Product/123");

    @Test
    void transitionsNotSyncedToSynced() {
        var status = new NotSynced();

        var result = SyncStatusMachine.markSynced(status, SHOPIFY_ID, NOW);

        assertThat(result).isInstanceOf(Synced.class);
        var synced = (Synced) result;
        assertThat(synced.shopifyId()).isEqualTo(SHOPIFY_ID);
        assertThat(synced.syncedAt()).isEqualTo(NOW);
    }

    @Test
    void incrementsAttemptsOnFailure() {
        var status = new SyncFailed("API error", 2, NOW);

        var result = SyncStatusMachine.markFailed(status, "New error", NOW);

        assertThat(result).isInstanceOf(SyncFailed.class);
        var failed = (SyncFailed) result;
        assertThat(failed.attempts()).isEqualTo(3);
        assertThat(failed.error()).isEqualTo("New error");
    }

    @Test
    void doesNotOverwriteSuccessWithFailure() {
        var status = new Synced(SHOPIFY_ID, NOW);

        var result = SyncStatusMachine.markFailed(status, "Error", NOW);

        assertThat(result).isInstanceOf(Synced.class);
    }
}
```

### Validation Test

**Effect-TS:**

```typescript
describe('ValidatedVariantSchema', () => {
  it('creates StandardVariant for non-custom size', async () => {
    const input = { size: Size.REGULAR }
    const result = await Effect.runPromise(S.decodeUnknown(ValidatedVariantSchema)(input))
    expect(result._tag).toBe('StandardVariant')
  })

  it('requires dimensions for CUSTOM size', async () => {
    const input = { size: Size.CUSTOM } // missing dimensions
    const result = await Effect.runPromiseEither(S.decodeUnknown(ValidatedVariantSchema)(input))
    expect(result._tag).toBe('Left')
  })
})
```

**Java:**

```java
class VariantValidatorTest {

    private final VariantValidator validator = new VariantValidator();

    @Test
    void createsStandardVariantForNonCustomSize() {
        var input = new UnvalidatedVariant("REGULAR", null, null);

        var result = validator.validate(input);

        assertThat(result.isValid()).isTrue();
        assertThat(result.get()).isInstanceOf(StandardVariant.class);
    }

    @Test
    void requiresDimensionsForCustomSize() {
        var input = new UnvalidatedVariant("CUSTOM", null, null);

        var result = validator.validate(input);

        assertThat(result.isInvalid()).isTrue();
        assertThat(result.getError()).contains("Custom size requires dimensions");
    }

    @Test
    void createsCustomVariantWithDimensions() {
        var input = new UnvalidatedVariant("CUSTOM", new Dimensions(150, 300), 25000);

        var result = validator.validate(input);

        assertThat(result.isValid()).isTrue();
        assertThat(result.get()).isInstanceOf(CustomVariant.class);
        var custom = (CustomVariant) result.get();
        assertThat(custom.dimensions().width()).isEqualTo(150);
    }
}
```

---

## 5. AssertJ + Vavr Assertions

```java
// Add dependency: org.assertj:assertj-vavr:0.4.3

import static org.assertj.vavr.api.VavrAssertions.assertThat;

@Test
void eitherAssertions() {
    Either<Error, String> success = Either.right("value");
    Either<Error, String> failure = Either.left(new Error("oops"));

    assertThat(success).isRight().containsOnRight("value");
    assertThat(failure).isLeft();
}

@Test
void optionAssertions() {
    Option<String> some = Option.some("value");
    Option<String> none = Option.none();

    assertThat(some).isDefined().contains("value");
    assertThat(none).isEmpty();
}

@Test
void validationAssertions() {
    Validation<String, Integer> valid = Validation.valid(42);
    Validation<String, Integer> invalid = Validation.invalid("error");

    assertThat(valid).isValid().containsValid(42);
    assertThat(invalid).isInvalid();
}
```
