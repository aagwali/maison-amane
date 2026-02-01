---
name: spring-boot-tooling
description: |
  Configure production-ready tooling for Spring Boot projects: logging, linting, error handling, observability.
  Use when: (1) Setting up structured logging with correlation IDs, (2) Adding code quality tools (Spotless, Checkstyle), (3) Configuring RFC 7807 error responses, (4) Setting up Spring Actuator health checks, (5) Adding OpenAPI documentation.
  Complements effect-to-spring-vavr for complete project setup.
---

# Spring Boot Tooling

Production-ready cross-cutting concerns for Spring Boot projects.

## Quick Setup

### Dependencies (build.gradle.kts)

```kotlin
dependencies {
    // Logging
    implementation("net.logstash.logback:logstash-logback-encoder:7.4")

    // Actuator
    implementation("org.springframework.boot:spring-boot-starter-actuator")

    // OpenAPI
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.3.0")
}

plugins {
    // Code quality
    checkstyle
    id("com.diffplug.spotless") version "6.23.3"
}
```

---

## Capabilities

### 1. Structured Logging

JSON logging with correlation ID propagation.

```java
// Filter adds correlationId to MDC
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(...) {
        MDC.put("correlationId", extractOrGenerate(request));
        filterChain.doFilter(request, response);
        MDC.clear();
    }
}
```

**Output (JSON):**

```json
{
  "@timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "message": "Creating product",
  "correlationId": "abc-123",
  "logger": "ProductService"
}
```

See [logging.md](references/logging.md) for complete configuration.

---

### 2. Code Quality

| Tool           | Purpose                         | Command                    |
| -------------- | ------------------------------- | -------------------------- |
| **Spotless**   | Auto-formatting (like Prettier) | `./gradlew spotlessApply`  |
| **Checkstyle** | Code style enforcement          | `./gradlew checkstyleMain` |
| **SpotBugs**   | Bug detection                   | `./gradlew spotbugsMain`   |

```kotlin
// build.gradle.kts
spotless {
    java {
        googleJavaFormat("1.19.1").aosp()
        removeUnusedImports()
    }
}
```

See [linting.md](references/linting.md) for complete configuration.

---

### 3. Error Handling (RFC 7807)

Standard error format with correlation tracking.

```java
public record ProblemDetail(
    String type,
    String title,
    int status,
    String detail,
    String correlationId,
    Instant timestamp
) {}

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ProblemDetail> handleValidation(ConstraintViolationException ex) {
        return ResponseEntity.badRequest()
            .body(ProblemDetail.validation(extractErrors(ex)));
    }
}
```

See [http-cross-cutting.md](references/http-cross-cutting.md) for patterns.

---

### 4. Health Checks (Actuator)

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,loggers
  endpoint:
    health:
      show-details: when_authorized
      probes:
        enabled: true
```

**Endpoints:**

- `/actuator/health` - Application health
- `/actuator/health/liveness` - Kubernetes liveness
- `/actuator/health/readiness` - Kubernetes readiness
- `/actuator/loggers` - Dynamic log level changes

---

### 5. OpenAPI Documentation

```java
@RestController
@Tag(name = "Products", description = "Product management")
public class ProductController {

    @Operation(summary = "Create product")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Created"),
        @ApiResponse(responseCode = "400", description = "Validation error")
    })
    @PostMapping("/api/products")
    public ResponseEntity<?> create(@Valid @RequestBody CreateProductRequest request) {
        // ...
    }
}
```

**Access:** `http://localhost:8080/swagger-ui.html`

---

### 6. CORS Configuration

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("${app.cors.allowed-origins}")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .exposedHeaders("X-Correlation-ID");
    }
}
```

---

## File Structure

```
src/main/
├── java/.../
│   ├── config/
│   │   ├── WebConfig.java           # CORS
│   │   └── OpenApiConfig.java       # Swagger
│   └── infrastructure/
│       └── http/
│           ├── filter/
│           │   ├── CorrelationIdFilter.java
│           │   └── RequestLoggingFilter.java
│           └── exception/
│               └── GlobalExceptionHandler.java
└── resources/
    ├── application.yml
    └── logback-spring.xml           # Logging config

config/
├── checkstyle/
│   └── checkstyle.xml
├── spotbugs/
│   └── exclude.xml
└── git-hooks/
    └── pre-commit
```

---

## Checklist

- [ ] Logback JSON configuration (`logback-spring.xml`)
- [ ] Correlation ID filter
- [ ] Global exception handler (RFC 7807)
- [ ] Spotless formatting
- [ ] Checkstyle rules
- [ ] Actuator endpoints configured
- [ ] OpenAPI annotations on controllers
- [ ] CORS configuration
- [ ] Git hooks for quality checks
