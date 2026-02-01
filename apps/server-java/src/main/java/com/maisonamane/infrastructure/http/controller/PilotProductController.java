package com.maisonamane.infrastructure.http.controller;

import com.maisonamane.application.pilot.command.CreatePilotProductCommand;
import com.maisonamane.application.pilot.handler.CreatePilotProductHandler;
import com.maisonamane.domain.pilot.error.PilotProductError;
import com.maisonamane.domain.shared.CorrelationId;
import com.maisonamane.domain.shared.UserId;
import com.maisonamane.infrastructure.http.dto.CreatePilotProductRequest;
import com.maisonamane.infrastructure.http.dto.ProblemDetail;
import com.maisonamane.infrastructure.http.mapper.PilotProductHttpMapper;
import com.maisonamane.port.driven.service.Clock;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PilotProductController {

        private static final Logger log = LoggerFactory.getLogger(PilotProductController.class);

        private final CreatePilotProductHandler createHandler;
        private final PilotProductHttpMapper mapper;
        private final Clock clock;

        public PilotProductController(
                        CreatePilotProductHandler createHandler, PilotProductHttpMapper mapper, Clock clock) {
                this.createHandler = createHandler;
                this.mapper = mapper;
                this.clock = clock;
        }

        @PostMapping("/pilot-product")
        public ResponseEntity<?> createPilotProduct(
                        @Valid @RequestBody CreatePilotProductRequest request, HttpServletRequest httpRequest) {

                var correlationId = CorrelationId.generate();
                var userId = UserId.of("system"); // TODO: extract from auth context
                var instance = httpRequest.getRequestURI();

                log.info(
                                "Creating pilot product - correlationId: {}, label: {}",
                                correlationId,
                                request.label());

                var command = CreatePilotProductCommand.of(
                                mapper.toUnvalidatedData(request), correlationId, userId, clock.now());

                return createHandler
                                .handle(command)
                                .fold(
                                                error -> handleError(error, correlationId.value(), instance),
                                                product -> {
                                                        log.info(
                                                                        "Pilot product created - correlationId: {}, productId: {}",
                                                                        correlationId,
                                                                        product.id());
                                                        return ResponseEntity.status(HttpStatus.CREATED)
                                                                        .body(mapper.toResponse(product));
                                                });
        }

        private ResponseEntity<?> handleError(
                        PilotProductError error, String correlationId, String instance) {
                log.warn("Error creating pilot product - correlationId: {}, error: {}", correlationId, error);

                return switch (error) {
                        case PilotProductError.ValidationError validationError -> ResponseEntity.badRequest()
                                        .body(
                                                        ProblemDetail.validation(
                                                                        validationError.message(),
                                                                        correlationId,
                                                                        instance,
                                                                        List.of(validationError.message())));

                        case PilotProductError.PersistenceError persistenceError -> ResponseEntity.status(
                                        HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(ProblemDetail.persistence(persistenceError.message(), correlationId,
                                                        instance));

                        case PilotProductError.NotFoundError notFoundError -> ResponseEntity.status(
                                        HttpStatus.NOT_FOUND)
                                        .body(ProblemDetail.notFound(notFoundError.message(), correlationId, instance));
                };
        }
}
