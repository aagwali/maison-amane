# Code Quality & Formatting for Spring Boot

## Table of Contents

1. [Spotless (Formatting)](#1-spotless-formatting)
2. [Checkstyle (Code Style)](#2-checkstyle-code-style)
3. [SpotBugs (Bug Detection)](#3-spotbugs-bug-detection)
4. [Git Hooks](#4-git-hooks)
5. [Commit Convention](#5-commit-convention)

---

## 1. Spotless (Formatting)

Spotless is the Java equivalent of Prettier - automatic code formatting.

### build.gradle.kts

```kotlin
plugins {
    id("com.diffplug.spotless") version "6.23.3"
}

spotless {
    java {
        target("src/**/*.java")

        // Use Google Java Format
        googleJavaFormat("1.19.1")
            .aosp()  // Android style (4-space indent)
            .reflowLongStrings()

        // Import ordering
        importOrder("java", "javax", "org", "com", "")
        removeUnusedImports()

        // License header (optional)
        licenseHeaderFile("config/license-header.txt")
    }

    kotlinGradle {
        target("*.gradle.kts")
        ktlint("1.0.1")
    }
}

// Run before compile
tasks.named("compileJava") {
    dependsOn("spotlessApply")
}
```

### Commands

```bash
# Check formatting
./gradlew spotlessCheck

# Auto-fix formatting
./gradlew spotlessApply
```

---

## 2. Checkstyle (Code Style)

Checkstyle enforces coding conventions.

### build.gradle.kts

```kotlin
plugins {
    checkstyle
}

checkstyle {
    toolVersion = "10.12.5"
    configFile = file("config/checkstyle/checkstyle.xml")
    isIgnoreFailures = false
    maxWarnings = 0
}

tasks.withType<Checkstyle> {
    reports {
        xml.required.set(true)
        html.required.set(true)
    }
}
```

### config/checkstyle/checkstyle.xml

```xml
<?xml version="1.0"?>
<!DOCTYPE module PUBLIC
    "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN"
    "https://checkstyle.org/dtds/configuration_1_3.dtd">

<module name="Checker">
    <property name="severity" value="error"/>
    <property name="fileExtensions" value="java"/>

    <!-- File length -->
    <module name="FileLength">
        <property name="max" value="500"/>
    </module>

    <!-- No tabs -->
    <module name="FileTabCharacter"/>

    <module name="TreeWalker">
        <!-- Naming conventions -->
        <module name="TypeName"/>
        <module name="MethodName"/>
        <module name="ConstantName"/>
        <module name="LocalVariableName"/>
        <module name="ParameterName"/>

        <!-- Imports -->
        <module name="AvoidStarImport"/>
        <module name="UnusedImports"/>
        <module name="RedundantImport"/>

        <!-- Complexity -->
        <module name="MethodLength">
            <property name="max" value="50"/>
        </module>
        <module name="ParameterNumber">
            <property name="max" value="7"/>
        </module>
        <module name="CyclomaticComplexity">
            <property name="max" value="10"/>
        </module>

        <!-- Best practices -->
        <module name="EqualsHashCode"/>
        <module name="SimplifyBooleanExpression"/>
        <module name="SimplifyBooleanReturn"/>
        <module name="StringLiteralEquality"/>

        <!-- Javadoc (optional) -->
        <module name="MissingJavadocMethod">
            <property name="scope" value="public"/>
            <property name="allowMissingPropertyJavadoc" value="true"/>
            <property name="tokens" value="METHOD_DEF"/>
        </module>
    </module>
</module>
```

### Commands

```bash
# Run checkstyle
./gradlew checkstyleMain checkstyleTest

# View report
open build/reports/checkstyle/main.html
```

---

## 3. SpotBugs (Bug Detection)

SpotBugs finds potential bugs via static analysis.

### build.gradle.kts

```kotlin
plugins {
    id("com.github.spotbugs") version "6.0.4"
}

spotbugs {
    toolVersion.set("4.8.2")
    ignoreFailures.set(false)
    excludeFilter.set(file("config/spotbugs/exclude.xml"))
}

tasks.withType<com.github.spotbugs.snom.SpotBugsTask> {
    reports.create("html") {
        required.set(true)
        outputLocation.set(file("${project.buildDir}/reports/spotbugs/main.html"))
    }
}
```

### config/spotbugs/exclude.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<FindBugsFilter>
    <!-- Exclude generated code -->
    <Match>
        <Source name="~.*Generated.*"/>
    </Match>

    <!-- Exclude test classes -->
    <Match>
        <Class name="~.*Test"/>
    </Match>

    <!-- Exclude specific false positives -->
    <Match>
        <Bug pattern="EI_EXPOSE_REP"/>
        <Class name="~.*Dto"/>
    </Match>
</FindBugsFilter>
```

---

## 4. Git Hooks

### Pre-commit Hook Setup

Create `config/git-hooks/pre-commit`:

```bash
#!/bin/sh
# Pre-commit hook: format and check

echo "Running Spotless..."
./gradlew spotlessCheck --daemon

if [ $? -ne 0 ]; then
    echo "Spotless check failed. Run './gradlew spotlessApply' to fix."
    exit 1
fi

echo "Running Checkstyle..."
./gradlew checkstyleMain --daemon

if [ $? -ne 0 ]; then
    echo "Checkstyle failed. Check the report."
    exit 1
fi

echo "Pre-commit checks passed!"
```

### Install Hook (build.gradle.kts)

```kotlin
tasks.register<Copy>("installGitHooks") {
    from("config/git-hooks")
    into(".git/hooks")
    fileMode = 0b111101101 // 755
}

tasks.named("build") {
    dependsOn("installGitHooks")
}
```

---

## 5. Commit Convention

### Commitlint (with Node.js)

If using Commitlint:

```bash
npm init -y
npm install --save-dev @commitlint/cli @commitlint/config-conventional husky
```

### commitlint.config.js

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['domain', 'application', 'infrastructure', 'api', 'config', 'deps', 'docs'],
    ],
  },
}
```

### Pure Gradle Alternative

Create `config/git-hooks/commit-msg`:

```bash
#!/bin/sh
# Validate commit message format

commit_regex='^(feat|fix|docs|style|refactor|test|chore)(\([a-z-]+\))?: .{1,50}'

if ! grep -qE "$commit_regex" "$1"; then
    echo "Invalid commit message format."
    echo "Expected: type(scope): message"
    echo "Example: feat(domain): add product aggregate"
    exit 1
fi
```

---

## Combined Configuration

### Full build.gradle.kts

```kotlin
plugins {
    java
    checkstyle
    id("com.diffplug.spotless") version "6.23.3"
    id("com.github.spotbugs") version "6.0.4"
}

// Spotless
spotless {
    java {
        target("src/**/*.java")
        googleJavaFormat("1.19.1").aosp()
        importOrder("java", "javax", "org", "com", "")
        removeUnusedImports()
    }
}

// Checkstyle
checkstyle {
    toolVersion = "10.12.5"
    configFile = file("config/checkstyle/checkstyle.xml")
}

// SpotBugs
spotbugs {
    toolVersion.set("4.8.2")
    excludeFilter.set(file("config/spotbugs/exclude.xml"))
}

// Quality gate task
tasks.register("qualityCheck") {
    dependsOn("spotlessCheck", "checkstyleMain", "spotbugsMain")
    group = "verification"
    description = "Runs all quality checks"
}

// Run quality before build
tasks.named("build") {
    dependsOn("qualityCheck")
}
```

### Commands Summary

```bash
# Format code
./gradlew spotlessApply

# Check all quality
./gradlew qualityCheck

# Individual checks
./gradlew spotlessCheck
./gradlew checkstyleMain
./gradlew spotbugsMain
```
