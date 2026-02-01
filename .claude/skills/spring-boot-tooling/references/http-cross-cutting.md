# HTTP Cross-Cutting Concerns for Spring Boot

## Table of Contents

1. [Error Handling (RFC 7807)](#1-error-handling-rfc-7807)
2. [CORS Configuration](#2-cors-configuration)
3. [Spring Actuator](#3-spring-actuator)
4. [OpenAPI Documentation](#4-openapi-documentation)
5. [Request Validation](#5-request-validation)

---

## 1. Error Handling (RFC 7807)

RFC 7807 Problem Details provides a standard format for HTTP API errors.

### ProblemDetail Record

```java
public record ProblemDetail(
    String type,
    String title,
    int status,
    String detail,
    String instance,
    // Extensions
    String correlationId,
    Instant timestamp,
    List<ValidationError> errors  // For validation errors
) {
    public record ValidationError(String field, String message) {}

    public static ProblemDetail of(int status, String title, String detail) {
        return new ProblemDetail(
            "about:blank",
            title,
            status,
            detail,
            null,
            MDC.get("correlationId"),
            Instant.now(),
            null
        );
    }

    public static ProblemDetail validation(List<ValidationError> errors) {
        return new ProblemDetail(
            "/errors/validation",
            "Validation Failed",
            400,
            "One or more fields are invalid",
            null,
            MDC.get("correlationId"),
            Instant.now(),
            errors
        );
    }
}
```

### Global Exception Handler

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ProblemDetail> handleValidation(ConstraintViolationException ex) {
        var errors = ex.getConstraintViolations().stream()
            .map(v -> new ProblemDetail.ValidationError(
                v.getPropertyPath().toString(),
                v.getMessage()
            ))
            .toList();

        log.warn("Validation failed: {}", errors);
        return ResponseEntity.badRequest().body(ProblemDetail.validation(errors));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        var errors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> new ProblemDetail.ValidationError(e.getField(), e.getDefaultMessage()))
            .toList();

        return ResponseEntity.badRequest().body(ProblemDetail.validation(errors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity
            .status(500)
            .body(ProblemDetail.of(500, "Internal Server Error", "An unexpected error occurred"));
    }
}
```

### Domain Error Mapping

```java
@Component
public class ErrorMapper {

    public ResponseEntity<ProblemDetail> toResponse(ProductCreationError error) {
        return switch (error) {
            case ValidationError v -> ResponseEntity
                .badRequest()
                .body(ProblemDetail.of(400, "Validation Error", String.join(", ", v.errors())));

            case PersistenceError p -> ResponseEntity
                .status(500)
                .body(ProblemDetail.of(500, "Persistence Error", p.message()));

            case ProductNotFoundError n -> ResponseEntity
                .status(404)
                .body(ProblemDetail.of(404, "Not Found", "Product not found: " + n.productId()));
        };
    }
}
```

### Controller Usage

```java
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final CreateProductHandler handler;
    private final ErrorMapper errorMapper;

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateProductRequest request) {
        return handler.handle(toCommand(request))
            .fold(
                errorMapper::toResponse,
                product -> ResponseEntity.status(201).body(toResponse(product))
            );
    }
}
```

---

## 2. CORS Configuration

### WebMvcConfigurer

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(allowedOrigins)
            .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
            .allowedHeaders("*")
            .exposedHeaders("X-Correlation-ID")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
```

### application.yml

```yaml
app:
  cors:
    allowed-origins: ${CORS_ORIGINS:http://localhost:3000,http://localhost:5173}
```

### Per-Controller CORS

```java
@RestController
@CrossOrigin(origins = "${app.cors.allowed-origins}")
@RequestMapping("/api/products")
public class ProductController {
    // ...
}
```

---

## 3. Spring Actuator

### Dependencies

```kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-actuator")
}
```

### application.yml

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,loggers,env
      base-path: /actuator
  endpoint:
    health:
      show-details: when_authorized
      probes:
        enabled: true
    info:
      enabled: true
  info:
    env:
      enabled: true
    git:
      mode: full

# Custom info
info:
  app:
    name: ${spring.application.name}
    version: '@project.version@'
    java:
      version: ${java.version}
```

### Custom Health Indicator

```java
@Component
public class MongoHealthIndicator implements HealthIndicator {

    private final MongoTemplate mongoTemplate;

    @Override
    public Health health() {
        try {
            mongoTemplate.executeCommand("{ ping: 1 }");
            return Health.up()
                .withDetail("database", "MongoDB")
                .withDetail("status", "connected")
                .build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("database", "MongoDB")
                .withException(e)
                .build();
        }
    }
}
```

### Liveness & Readiness Probes (Kubernetes)

```yaml
# application.yml
management:
  endpoint:
    health:
      probes:
        enabled: true
      group:
        liveness:
          include: livenessState
        readiness:
          include: readinessState,mongo,rabbit
```

```yaml
# kubernetes deployment
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## 4. OpenAPI Documentation

### Dependencies

```kotlin
dependencies {
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.3.0")
}
```

### application.yml

```yaml
springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html
    operationsSorter: method
    tagsSorter: alpha
  info:
    title: Product API
    version: v1
    description: API for managing products
```

### OpenAPI Configuration

```java
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Product API")
                .version("1.0.0")
                .description("DDD-based Product Management API")
                .contact(new Contact()
                    .name("Team")
                    .email("team@company.com")))
            .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
            .components(new Components()
                .addSecuritySchemes("bearerAuth",
                    new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")));
    }
}
```

### Controller Annotations

```java
@RestController
@RequestMapping("/api/products")
@Tag(name = "Products", description = "Product management operations")
public class ProductController {

    @Operation(
        summary = "Create a new product",
        description = "Creates a product with the provided details"
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Product created"),
        @ApiResponse(responseCode = "400", description = "Validation error",
            content = @Content(schema = @Schema(implementation = ProblemDetail.class))),
        @ApiResponse(responseCode = "500", description = "Internal error")
    })
    @PostMapping
    public ResponseEntity<?> create(
        @Valid @RequestBody CreateProductRequest request
    ) {
        // ...
    }
}
```

---

## 5. Request Validation

### Bean Validation Annotations

```java
public record CreateProductRequest(
    @NotBlank(message = "Label is required")
    @Size(max = 200, message = "Label must be less than 200 characters")
    String label,

    @NotNull(message = "Type is required")
    ProductType type,

    @NotNull(message = "Category is required")
    ProductCategory category,

    @Size(max = 2000, message = "Description must be less than 2000 characters")
    String description,

    @NotEmpty(message = "At least one variant is required")
    @Valid
    List<VariantRequest> variants,

    @NotEmpty(message = "At least one view is required")
    @Valid
    List<ViewRequest> views
) {}

public record VariantRequest(
    @NotNull(message = "Size is required")
    Size size,

    @Valid
    DimensionsRequest customDimensions,

    @Positive(message = "Price must be positive")
    Integer price
) {}
```

### Custom Validator

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = CustomVariantValidator.class)
public @interface ValidCustomVariant {
    String message() default "Custom size requires dimensions and price";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class CustomVariantValidator implements ConstraintValidator<ValidCustomVariant, VariantRequest> {

    @Override
    public boolean isValid(VariantRequest variant, ConstraintValidatorContext context) {
        if (variant.size() == Size.CUSTOM) {
            return variant.customDimensions() != null && variant.price() != null;
        }
        return true;
    }
}
```

### Validation in Controller

```java
@RestController
@RequestMapping("/api/products")
@Validated  // Enable method-level validation
public class ProductController {

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateProductRequest request) {
        // Validation happens automatically
        // Errors handled by GlobalExceptionHandler
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> findById(
        @PathVariable @Pattern(regexp = "^[a-zA-Z0-9-]+$") String id
    ) {
        // Path variable validation
    }
}
```

---

## Quick Reference

| Concern       | Solution                  |
| ------------- | ------------------------- |
| Error format  | RFC 7807 ProblemDetail    |
| Global errors | `@RestControllerAdvice`   |
| CORS          | `WebMvcConfigurer`        |
| Health checks | Spring Actuator           |
| API docs      | SpringDoc OpenAPI         |
| Validation    | Bean Validation (JSR-380) |
