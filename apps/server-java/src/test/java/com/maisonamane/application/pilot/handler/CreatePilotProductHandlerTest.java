package com.maisonamane.application.pilot.handler;

import com.maisonamane.application.pilot.command.CreatePilotProductCommand;
import com.maisonamane.application.pilot.command.UnvalidatedProductData;
import com.maisonamane.application.pilot.command.UnvalidatedProductData.*;
import com.maisonamane.domain.pilot.aggregate.PilotProduct;
import com.maisonamane.domain.pilot.enums.ProductStatus;
import com.maisonamane.domain.pilot.event.PilotProductPublished;
import com.maisonamane.domain.shared.CorrelationId;
import com.maisonamane.domain.shared.UserId;
import com.maisonamane.infrastructure.persistence.inmemory.InMemoryPilotProductRepository;
import com.maisonamane.testutil.DeterministicIdGenerator;
import com.maisonamane.testutil.FixedClock;
import com.maisonamane.testutil.SpyEventPublisher;
import io.vavr.control.Either;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Test for CreatePilotProductHandler using test doubles.
 * Maps Effect-TS handler tests to JUnit with AssertJ.
 */
class CreatePilotProductHandlerTest {

    private InMemoryPilotProductRepository repository;
    private DeterministicIdGenerator idGenerator;
    private FixedClock clock;
    private SpyEventPublisher eventPublisher;
    private CreatePilotProductHandler handler;

    @BeforeEach
    void setUp() {
        repository = new InMemoryPilotProductRepository();
        idGenerator = new DeterministicIdGenerator();
        clock = FixedClock.at("2024-01-15T10:00:00Z");
        eventPublisher = new SpyEventPublisher();

        handler = new CreatePilotProductHandler(
            repository,
            idGenerator,
            clock,
            eventPublisher
        );
    }

    @Test
    void shouldCreatePilotProductSuccessfully() {
        // Given
        UnvalidatedProductData data = createValidProductData();
        CreatePilotProductCommand command = CreatePilotProductCommand.of(
            data,
            CorrelationId.of("test-correlation-id"),
            UserId.of("test-user-id"),
            clock.now()
        );

        // When
        Either<?, PilotProduct> result = handler.handle(command);

        // Then
        assertThat(result.isRight()).isTrue();
        assertThat(repository.size()).isEqualTo(1);
    }

    @Test
    void shouldPublishEventWhenProductIsPublished() {
        // Given
        UnvalidatedProductData data = createValidProductData();
        CreatePilotProductCommand command = CreatePilotProductCommand.of(
            data,
            CorrelationId.of("test-correlation-id"),
            UserId.of("test-user-id"),
            clock.now()
        );

        // When
        handler.handle(command);

        // Then
        assertThat(eventPublisher.getEventCount()).isEqualTo(1);
        assertThat(eventPublisher.hasPublished(PilotProductPublished.class)).isTrue();
    }

    @Test
    void shouldNotPublishEventWhenProductIsDraft() {
        // Given
        UnvalidatedProductData data = createValidProductData("DRAFT");
        CreatePilotProductCommand command = CreatePilotProductCommand.of(
            data,
            CorrelationId.of("test-correlation-id"),
            UserId.of("test-user-id"),
            clock.now()
        );

        // When
        handler.handle(command);

        // Then
        assertThat(eventPublisher.getEventCount()).isEqualTo(0);
    }

    private UnvalidatedProductData createValidProductData() {
        return createValidProductData("PUBLISHED");
    }

    private UnvalidatedProductData createValidProductData(String status) {
        return new UnvalidatedProductData(
            "Test Product",
            "TAPIS",
            "STANDARD",
            "Test description",
            "STANDARD",
            List.of(
                new UnvalidatedVariant("REGULAR", null, null)
            ),
            List.of(
                new UnvalidatedView("FRONT", "https://example.com/front.jpg"),
                new UnvalidatedView("DETAIL", "https://example.com/detail.jpg")
            ),
            status
        );
    }
}
