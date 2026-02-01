package com.maisonamane.infrastructure.http.controller;

import com.maisonamane.infrastructure.http.dto.HealthCheckResponse;
import java.util.HashMap;
import java.util.Map;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SystemController {

    private final MongoTemplate mongoTemplate;

    public SystemController(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping("/health")
    public ResponseEntity<HealthCheckResponse> health() {
        Map<String, String> services = new HashMap<>();

        try {
            mongoTemplate.getDb().runCommand(new org.bson.Document("ping", 1));
            services.put("database", "up");
        } catch (Exception e) {
            services.put("database", "down");
            return ResponseEntity.ok(HealthCheckResponse.degraded(services));
        }

        return ResponseEntity.ok(HealthCheckResponse.ok(services));
    }
}
