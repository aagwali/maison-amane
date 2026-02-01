package com.maisonamane.infrastructure.http.dto;

import java.time.Instant;
import java.util.Map;

public record HealthCheckResponse(String status, Instant timestamp, Map<String, String> services) {

    public static HealthCheckResponse ok(Map<String, String> services) {
        return new HealthCheckResponse("ok", Instant.now(), services);
    }

    public static HealthCheckResponse degraded(Map<String, String> services) {
        return new HealthCheckResponse("degraded", Instant.now(), services);
    }
}
