# Logging Configuration for Spring Boot

## Table of Contents

1. [Structured JSON Logging](#1-structured-json-logging)
2. [MDC for Correlation](#2-mdc-for-correlation)
3. [Log Levels Configuration](#3-log-levels-configuration)
4. [Request/Response Logging](#4-requestresponse-logging)

---

## 1. Structured JSON Logging

### Dependencies (build.gradle.kts)

```kotlin
dependencies {
    // Logback is included with spring-boot-starter
    // Add JSON encoder
    implementation("net.logstash.logback:logstash-logback-encoder:7.4")
}
```

### logback-spring.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>

    <!-- Console appender for development -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} %highlight(%-5level) [%thread] %cyan(%logger{36}) - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- JSON appender for production -->
    <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <includeMdcKeyName>correlationId</includeMdcKeyName>
            <includeMdcKeyName>userId</includeMdcKeyName>
            <includeMdcKeyName>requestPath</includeMdcKeyName>
            <timeZone>UTC</timeZone>
            <fieldNames>
                <timestamp>@timestamp</timestamp>
                <message>message</message>
                <logger>logger</logger>
                <level>level</level>
                <thread>thread</thread>
            </fieldNames>
        </encoder>
    </appender>

    <!-- Profile-based configuration -->
    <springProfile name="development">
        <root level="INFO">
            <appender-ref ref="CONSOLE"/>
        </root>
        <logger name="com.company.project" level="DEBUG"/>
    </springProfile>

    <springProfile name="production">
        <root level="INFO">
            <appender-ref ref="JSON"/>
        </root>
        <logger name="com.company.project" level="INFO"/>
    </springProfile>

    <springProfile name="test">
        <root level="WARN">
            <appender-ref ref="CONSOLE"/>
        </root>
    </springProfile>
</configuration>
```

---

## 2. MDC for Correlation

### CorrelationId Filter

```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    public static final String CORRELATION_ID_MDC_KEY = "correlationId";
    public static final String USER_ID_MDC_KEY = "userId";
    public static final String REQUEST_PATH_MDC_KEY = "requestPath";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            String correlationId = extractOrGenerateCorrelationId(request);

            MDC.put(CORRELATION_ID_MDC_KEY, correlationId);
            MDC.put(REQUEST_PATH_MDC_KEY, request.getRequestURI());

            // Add to response header for tracing
            response.setHeader(CORRELATION_ID_HEADER, correlationId);

            filterChain.doFilter(request, response);
        } finally {
            MDC.clear();
        }
    }

    private String extractOrGenerateCorrelationId(HttpServletRequest request) {
        String correlationId = request.getHeader(CORRELATION_ID_HEADER);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = UUID.randomUUID().toString();
        }
        return correlationId;
    }
}
```

### Using MDC in Services

```java
@Service
@Slf4j
public class ProductService {

    public Either<ProductError, Product> createProduct(CreateProductCommand command) {
        // CorrelationId automatically included in logs via MDC
        log.info("Creating product: {}", command.label());

        return validateAndCreate(command)
            .peek(product -> log.info("Product created: {}", product.id()))
            .peekLeft(error -> log.warn("Product creation failed: {}", error));
    }
}
```

### Log Output (JSON)

```json
{
  "@timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "logger": "com.company.project.application.ProductService",
  "message": "Creating product: Tapis Berbère",
  "correlationId": "abc-123-def",
  "userId": "user-456",
  "requestPath": "/api/products",
  "thread": "http-nio-8080-exec-1"
}
```

---

## 3. Log Levels Configuration

### application.yml

```yaml
logging:
  level:
    root: INFO
    com.company.project: ${LOG_LEVEL:DEBUG}
    # Reduce noise from libraries
    org.springframework.web: INFO
    org.springframework.data.mongodb: WARN
    org.springframework.amqp: INFO
    org.mongodb.driver: WARN

  # Pattern for console (dev)
  pattern:
    console: '%d{HH:mm:ss.SSS} %highlight(%-5level) [%thread] %cyan(%logger{36}) - %msg%n'
```

### Dynamic Log Level (Actuator)

```yaml
management:
  endpoints:
    web:
      exposure:
        include: loggers
  endpoint:
    loggers:
      enabled: true
```

```bash
# View current level
curl http://localhost:8080/actuator/loggers/com.company.project

# Change level at runtime
curl -X POST http://localhost:8080/actuator/loggers/com.company.project \
  -H "Content-Type: application/json" \
  -d '{"configuredLevel": "DEBUG"}'
```

---

## 4. Request/Response Logging

### Request Logging Filter

```java
@Component
@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        long startTime = System.currentTimeMillis();

        try {
            filterChain.doFilter(request, response);
        } finally {
            long duration = System.currentTimeMillis() - startTime;

            log.info("HTTP {} {} - {} ({}ms)",
                request.getMethod(),
                request.getRequestURI(),
                response.getStatus(),
                duration
            );
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Skip actuator endpoints
        return path.startsWith("/actuator");
    }
}
```

### Logging Domain Events

```java
@Component
@Slf4j
public class LoggingEventPublisher implements EventPublisher {

    private final EventPublisher delegate;

    @Override
    public Either<EventPublishError, Void> publish(DomainEvent event) {
        log.info("Publishing event: {} (correlationId={})",
            event.getClass().getSimpleName(),
            event.correlationId()
        );

        return delegate.publish(event)
            .peek(v -> log.debug("Event published successfully"))
            .peekLeft(err -> log.error("Event publish failed: {}", err.message()));
    }
}
```

---

## Quick Reference

| Aspect          | Configuration                         |
| --------------- | ------------------------------------- |
| JSON format     | `logstash-logback-encoder`            |
| Correlation     | MDC + Filter                          |
| Dynamic levels  | Actuator `/loggers`                   |
| Request tracing | Custom filter                         |
| Profile-based   | `springProfile` in logback-spring.xml |
