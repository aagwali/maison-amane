package com.maisonamane.infrastructure.http.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProblemDetail(
        String type,
        String title,
        int status,
        String detail,
        String instance,
        String correlationId,
        String code,
        Instant timestamp,
        List<String> errors) {

    public static ProblemDetail validation(
            String detail, String correlationId, String instance, List<String> errors) {
        return new ProblemDetail(
                "https://api.maisonamane.com/errors/validation",
                "Validation Error",
                400,
                detail,
                instance,
                correlationId,
                "PILOT_VALIDATION_001",
                Instant.now(),
                errors);
    }

    public static ProblemDetail persistence(String detail, String correlationId, String instance) {
        return new ProblemDetail(
                "https://api.maisonamane.com/errors/persistence",
                "Persistence Error",
                500,
                detail,
                instance,
                correlationId,
                "PILOT_PERSISTENCE_001",
                Instant.now(),
                null);
    }

    public static ProblemDetail notFound(String detail, String correlationId, String instance) {
        return new ProblemDetail(
                "https://api.maisonamane.com/errors/not-found",
                "Not Found",
                404,
                detail,
                instance,
                correlationId,
                "PILOT_NOT_FOUND_001",
                Instant.now(),
                null);
    }

    public static ProblemDetail internal(String detail, String correlationId, String instance) {
        return new ProblemDetail(
                "https://api.maisonamane.com/errors/internal",
                "Internal Server Error",
                500,
                detail,
                instance,
                correlationId,
                "SYSTEM_ERROR_001",
                Instant.now(),
                null);
    }
}
