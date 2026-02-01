# Gradle Project Structure for DDD + Hexagonal

## Table of Contents

1. [Single Module Structure](#1-single-module-structure)
2. [Multi-Module Structure](#2-multi-module-structure)
3. [Build Configuration](#3-build-configuration)
4. [Dependencies](#4-dependencies)

---

## 1. Single Module Structure

For simpler projects (single bounded context):

```
project-name/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/company/project/
│   │   │       ├── domain/
│   │   │       │   └── {context}/
│   │   │       │       ├── aggregate/
│   │   │       │       ├── valueobject/
│   │   │       │       ├── event/
│   │   │       │       ├── service/
│   │   │       │       └── error/
│   │   │       ├── application/
│   │   │       │   └── {context}/
│   │   │       │       ├── command/
│   │   │       │       ├── handler/
│   │   │       │       ├── query/
│   │   │       │       └── validation/
│   │   │       ├── port/
│   │   │       │   ├── driven/
│   │   │       │   │   ├── repository/
│   │   │       │   │   └── service/
│   │   │       │   └── driving/
│   │   │       ├── infrastructure/
│   │   │       │   ├── persistence/
│   │   │       │   │   └── mongodb/
│   │   │       │   ├── messaging/
│   │   │       │   │   └── rabbitmq/
│   │   │       │   ├── http/
│   │   │       │   │   ├── controller/
│   │   │       │   │   └── mapper/
│   │   │       │   └── service/
│   │   │       └── config/
│   │   └── resources/
│   │       └── application.yml
│   └── test/
│       ├── java/
│       │   └── com/company/project/
│       │       ├── domain/
│       │       ├── application/
│       │       ├── infrastructure/
│       │       └── testutil/
│       └── resources/
│           └── application-test.yml
└── docker-compose.yml
```

---

## 2. Multi-Module Structure

For complex projects with multiple bounded contexts (mirrors monorepo):

```
project-name/
├── build.gradle.kts              # Root build file
├── settings.gradle.kts           # Module declarations
├── gradle.properties
├── apps/
│   ├── server/                   # Main API application
│   │   ├── build.gradle.kts
│   │   └── src/
│   │       ├── main/java/.../
│   │       └── test/java/.../
│   └── consumers/
│       ├── catalog-projection/   # Consumer app
│       │   ├── build.gradle.kts
│       │   └── src/
│       └── shopify-sync/         # Consumer app
│           ├── build.gradle.kts
│           └── src/
├── packages/
│   ├── api/                      # Shared API contracts
│   │   ├── build.gradle.kts
│   │   └── src/
│   └── shared-kernel/            # Cross-cutting concerns
│       ├── build.gradle.kts
│       └── src/
└── docker-compose.yml
```

### settings.gradle.kts (Multi-Module)

```kotlin
rootProject.name = "project-name"

include(":apps:server")
include(":apps:consumers:catalog-projection")
include(":apps:consumers:shopify-sync")
include(":packages:api")
include(":packages:shared-kernel")
```

---

## 3. Build Configuration

### Root build.gradle.kts

```kotlin
plugins {
    java
    id("org.springframework.boot") version "3.2.0" apply false
    id("io.spring.dependency-management") version "1.1.4" apply false
}

allprojects {
    group = "com.company"
    version = "1.0.0"

    repositories {
        mavenCentral()
    }
}

subprojects {
    apply(plugin = "java")

    java {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }

    tasks.withType<JavaCompile> {
        options.compilerArgs.addAll(listOf(
            "--enable-preview",
            "-parameters"
        ))
    }

    tasks.withType<Test> {
        useJUnitPlatform()
        jvmArgs("--enable-preview")
    }
}
```

### Application Module build.gradle.kts

```kotlin
plugins {
    id("org.springframework.boot")
    id("io.spring.dependency-management")
}

dependencies {
    // Project modules
    implementation(project(":packages:api"))
    implementation(project(":packages:shared-kernel"))

    // Spring Boot
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-mongodb")
    implementation("org.springframework.boot:spring-boot-starter-amqp")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // Vavr
    implementation("io.vavr:vavr:0.10.4")

    // Testing
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.testcontainers:mongodb:1.19.3")
    testImplementation("org.testcontainers:rabbitmq:1.19.3")
}
```

### Library Module build.gradle.kts (packages/api)

```kotlin
plugins {
    `java-library`
}

dependencies {
    api("io.vavr:vavr:0.10.4")
    api("jakarta.validation:jakarta.validation-api:3.0.2")
}
```

---

## 4. Dependencies

### Core Dependencies

```kotlin
dependencies {
    // Spring Boot starters
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-mongodb")
    implementation("org.springframework.boot:spring-boot-starter-amqp")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // Vavr (functional programming)
    implementation("io.vavr:vavr:0.10.4")

    // Jackson Vavr module (for JSON serialization)
    implementation("io.vavr:vavr-jackson:0.10.3")

    // OpenAPI / Swagger
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.3.0")
}
```

### Test Dependencies

```kotlin
dependencies {
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.amqp:spring-rabbit-test")

    // Testcontainers
    testImplementation("org.testcontainers:junit-jupiter:1.19.3")
    testImplementation("org.testcontainers:mongodb:1.19.3")
    testImplementation("org.testcontainers:rabbitmq:1.19.3")

    // AssertJ Vavr
    testImplementation("org.assertj:assertj-vavr:0.4.3")
}
```

---

## 5. Configuration Files

### application.yml

```yaml
spring:
  application:
    name: project-name
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:development}

  data:
    mongodb:
      uri: ${MONGO_URI:mongodb://localhost:27017}
      database: ${MONGO_DB:project_db}

  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    username: ${RABBITMQ_USER:guest}
    password: ${RABBITMQ_PASSWORD:guest}

server:
  port: ${PORT:3001}

logging:
  level:
    root: INFO
    com.company.project: DEBUG

# Custom properties
app:
  retry:
    initial-delay-ms: ${RETRY_INITIAL_DELAY:1000}
    multiplier: ${RETRY_MULTIPLIER:2}
    max-retries: ${RETRY_MAX:5}
```

### application-test.yml

```yaml
spring:
  data:
    mongodb:
      uri: ${MONGO_URI:mongodb://localhost:27017}
      database: test_db

  rabbitmq:
    host: localhost
    port: 5672

logging:
  level:
    root: WARN
    com.company.project: DEBUG
```

---

## 6. Package Naming Convention

Map from TypeScript structure:

| TypeScript Path                       | Java Package                                             |
| ------------------------------------- | -------------------------------------------------------- |
| `domain/pilot/aggregate.ts`           | `com.company.project.domain.pilot.aggregate`             |
| `domain/pilot/value-objects/`         | `com.company.project.domain.pilot.valueobject`           |
| `application/pilot/commands/`         | `com.company.project.application.pilot.command`          |
| `application/pilot/handlers/`         | `com.company.project.application.pilot.handler`          |
| `ports/driven/repositories/`          | `com.company.project.port.driven.repository`             |
| `infrastructure/persistence/mongodb/` | `com.company.project.infrastructure.persistence.mongodb` |
| `infrastructure/http/handlers/`       | `com.company.project.infrastructure.http.controller`     |
| `composition/layers/`                 | `com.company.project.config`                             |
