# Effect-TS Patterns - Queries ast-grep

Ce fichier contient toutes les queries ast-grep pour les patterns Effect-TS de ce codebase, organisées par couche architecturale.

---

## Domain Layer Patterns

### 1. S.TaggedStruct (Aggregates & Entities)

**Query:**

```bash
ast-grep --pattern 'S.TaggedStruct($NAME, { $$$ })' apps/server/src/domain
```

**Output attendu:**

```
apps/server/src/domain/pilot/aggregate.ts
71:const PilotProductSchema = S.TaggedStruct("PilotProduct", {

apps/server/src/domain/catalog/projections/catalog-product.ts
15:const CatalogProductSchema = S.TaggedStruct("CatalogProduct", {
```

**Cas d'usage:**

- Lister tous les aggregates et entities du domain
- Vérifier cohérence des naming conventions (suffixe `Schema`)
- Auditer les aggregates sans events

**Variante - Trouver un aggregate spécifique:**

```bash
ast-grep --pattern 'S.TaggedStruct("PilotProduct", { $$$ })' apps/server/src
```

---

### 2. S.brand (Branded IDs & Value Objects)

**Query:**

```bash
ast-grep --pattern 'S.String.pipe(S.brand($BRAND))' apps/server/src/domain/**/ids.ts
```

**Output attendu:**

```
apps/server/src/domain/pilot/value-objects/ids.ts
9:export const ProductIdSchema = S.String.pipe(S.brand("ProductId"))
17:export const VariantIdSchema = S.String.pipe(S.brand("VariantId"))
```

**Cas d'usage:**

- Vérifier que tous les IDs utilisent branded types
- Lister tous les branded types pour documentation
- Trouver IDs sans validation (juste `S.String.pipe(S.brand(...))` sans contraintes)

**Variante - Branded numbers:**

```bash
ast-grep --pattern 'S.Number.pipe(S.brand($BRAND))' apps/server/src/domain
```

**Variante - Branded avec contraintes:**

```bash
ast-grep --pattern 'S.String.pipe($$$, S.brand($BRAND))' apps/server/src/domain
```

---

### 3. S.Union (Discriminated Unions)

**Query:**

```bash
ast-grep --pattern 'S.Union($$$)' apps/server/src/domain
```

**Output attendu:**

```
apps/server/src/domain/pilot/value-objects/variants.ts
37:export const VariantBaseSchema = S.Union(

apps/server/src/domain/catalog/projections/catalog-product.ts
33:export const CatalogVariantSchema = S.Union(
```

**Cas d'usage:**

- Identifier state machines et variantes
- Trouver unions discriminées pour refactoring
- Vérifier que chaque membre a un `_tag`

---

### 4. S.Struct (Simple Value Objects)

**Query:**

```bash
ast-grep --pattern 'S.Struct({ $$$ })' apps/server/src/domain/**/value-objects
```

**Cas d'usage:**

- Trouver value objects simples (sans \_tag)
- Distinguer VOs de entities (entities ont TaggedStruct)

---

### 5. Data.TaggedError (Domain Errors)

**Query:**

```bash
ast-grep --pattern 'Data.TaggedError($TAG)' apps/server/src/domain/**/errors.ts
```

**Output attendu:**

```
apps/server/src/domain/pilot/errors.ts
12:export class ValidationError extends Data.TaggedError("ValidationError")
19:export class PersistenceError extends Data.TaggedError("PersistenceError")
```

**Cas d'usage:**

- Lister toutes les erreurs du domain
- Documenter la hiérarchie d'erreurs
- Vérifier cohérence naming (suffixe `Error`)

---

### 6. Data.case (Constructors)

**Query:**

```bash
ast-grep --pattern 'Data.case<$TYPE>()({ $$$ })' apps/server/src/domain
```

**Output attendu:**

```
apps/server/src/domain/pilot/aggregate.ts
85:  Data.case<PilotProduct>()({ _tag: "PilotProduct", ...params })
```

**Cas d'usage:**

- Trouver tous les constructeurs immuables
- Vérifier pattern cohérent (`MakeXxx` function)
- Auditer l'usage de Data.case vs constructeurs manuels

**Variante - Trouver fonction constructeur:**

```bash
ast-grep --pattern 'export const Make$NAME = ($$$) => Data.case<$TYPE>()' apps/server/src/domain
```

---

### 7. Domain Events

**Query:**

```bash
ast-grep --pattern 'S.TaggedStruct($NAME, { $$$ })' apps/server/src/domain/**/events.ts
```

**Cas d'usage:**

- Lister tous les events du domain
- Vérifier naming convention (suffixe event name)
- Auditer metadata des events (correlationId, timestamp, etc.)

---

## Application Layer Patterns

### 1. Effect.gen (Handlers)

**Query:**

```bash
ast-grep --pattern 'Effect.gen(function* () { $$$ })' apps/server/src/application
```

**Output attendu:**

```
apps/server/src/application/pilot/handlers/create-pilot-product.handler.ts
40:  Effect.gen(function* () {
62:  Effect.gen(function* () {

apps/server/src/application/catalog/handlers/catalog-projection.handler.ts
29:  Effect.gen(function* () {
```

**Cas d'usage:**

- Lister tous les handlers avec Effect.gen
- Identifier handlers pour analyse de dépendances
- Trouver handlers sans error handling

**Variante - Arrow function syntax:**

```bash
ast-grep --pattern 'Effect.gen(function*() { $$$ })' apps/server/src/application
```

---

### 2. yield\* (Dependencies)

**Query:**

```bash
ast-grep --pattern 'yield* $SERVICE' apps/server/src/application
```

**Output attendu:**

```
yield* PilotProductRepository
yield* IdGenerator
yield* Clock
yield* EventPublisher
```

**Cas d'usage:**

- Identifier quels services sont utilisés par handlers
- Tracer les dépendances pour refactoring
- Auditer usages d'un service spécifique

**Variante - Service spécifique:**

```bash
ast-grep --pattern 'yield* PilotProductRepository' apps/server/src/application
```

---

### 3. S.transformOrFail (Validation with Transform)

**Query:**

```bash
ast-grep --pattern 'S.transformOrFail($$$)' apps/server/src/application/**/validation
```

**Output attendu:**

```
apps/server/src/application/pilot/validation/variant-input.schema.ts
52:S.transformOrFail(
```

**Cas d'usage:**

- Identifier transformations avec logique métier
- Auditer validations complexes
- Migrer vers pattern plus simple si possible

---

### 4. S.filter (Validation Predicates)

**Query:**

```bash
ast-grep --pattern 'S.filter($$$)' apps/server/src/application/**/validation
```

**Cas d'usage:**

- Identifier validations par prédicat
- Candidats pour migration vers `S.transformOrFail` (meilleurs messages d'erreur)

---

### 5. Command DTOs (TaggedStruct)

**Query:**

```bash
ast-grep --pattern 'S.TaggedStruct($NAME, { $$$ })' apps/server/src/application/**/commands
```

**Output attendu:**

```
apps/server/src/application/pilot/commands/create-pilot-product.command.ts
41:const PilotProductCreationCommandSchema = S.TaggedStruct(
```

**Cas d'usage:**

- Lister toutes les commandes CQRS
- Vérifier naming convention (suffixe `Command`)
- Auditer champs communs (userId, correlationId, etc.)

---

### 6. Query Handlers

**Query pour query functions:**

```bash
ast-grep --pattern 'export const get$NAME = ($$$): Effect.Effect<$$$> =>' \
         apps/server/src/application/**/queries
```

**Cas d'usage:**

- Lister toutes les queries CQRS
- Distinguer read vs write operations
- Vérifier cohérence naming (`get`, `find`, `list`)

---

## Ports Layer Patterns

### 1. Context.Tag (Port Declarations)

**Query:**

```bash
ast-grep --pattern 'export class $CLASS extends Context.Tag($TAG)<$T, $S>() {}' \
         apps/server/src/ports
```

**Output attendu:**

```
apps/server/src/ports/driven/repositories/pilot-product.repository.ts
26:export class PilotProductRepository extends Context.Tag("PilotProductRepository")<
```

**Cas d'usage:**

- Lister tous les ports (repositories, services)
- Vérifier que chaque port a une implémentation Layer
- Auditer cohérence naming (class = tag name)

**Note:** Ce pattern peut ne pas matcher si la définition s'étend sur plusieurs lignes. Alternative:

```bash
ast-grep --pattern 'Context.Tag($TAG)' apps/server/src/ports
```

---

### 2. Repository Interface Methods

**Query:**

```bash
ast-grep --pattern 'Effect.Effect<$RETURN, $ERROR>' \
         apps/server/src/ports/**/repositories
```

**Cas d'usage:**

- Identifier signatures des méthodes repository
- Vérifier cohérence des types d'erreur
- Auditer return types (Option, Array, etc.)

---

### 3. Service Interfaces

**Query:**

```bash
ast-grep --pattern 'export interface $NAME { $$$ }' \
         apps/server/src/ports/**/services
```

**Cas d'usage:**

- Lister toutes les interfaces de services
- Vérifier que l'interface match le Context.Tag
- Auditer méthodes readonly

---

## Infrastructure Layer Patterns

### 1. Layer.effect (Implementations)

**Query:**

```bash
ast-grep --pattern 'Layer.effect($TAG, $IMPL)' apps/server/src/infrastructure
```

**Output attendu:**

```
apps/server/src/infrastructure/persistence/mongodb/pilot-product.repository.ts
41:export const MongodbPilotProductRepositoryLive = Layer.effect(

apps/server/src/infrastructure/messaging/rabbitmq/event-publisher.ts
90:export const RabbitMQPublisherLayer = Layer.effect(
```

**Cas d'usage:**

- Vérifier que chaque port a une implémentation Layer
- Lister toutes les implémentations pour audit
- Identifier layers manquants

---

### 2. Layer.mergeAll (Composition)

**Query:**

```bash
ast-grep --pattern 'Layer.mergeAll($$$)' apps/server/src/composition
```

**Output attendu:**

```
apps/server/src/composition/layers/development.layer.ts
23:export const DevelopmentLayer = Layer.mergeAll(
```

**Cas d'usage:**

- Identifier layers composés (DevelopmentLayer, ProductionLayer)
- Auditer différences dev vs prod
- Vérifier cohérence des dépendances

---

### 3. Layer.provide (Wiring)

**Query:**

```bash
ast-grep --pattern 'Layer.provide($$$)' apps/server/src
```

**Cas d'usage:**

- Tracer comment layers sont fournis aux Effect
- Identifier l'ordre de composition
- Débugger problèmes de DI

---

### 4. Repository Implementations (Factory Pattern)

**Query:**

```bash
ast-grep --pattern 'export const create$NAME = ($$$): $TYPE => ({ $$$ })' \
         apps/server/src/infrastructure/persistence
```

**Cas d'usage:**

- Lister toutes les factory functions repository
- Vérifier pattern cohérent (create + Repository suffix)
- Auditer dépendances (db, logger, etc.)

---

## Composition Layer Patterns

### 1. DevelopmentLayer

**Query:**

```bash
ast-grep --pattern 'export const DevelopmentLayer = $$$' \
         apps/server/src/composition/layers/development.layer.ts
```

**Cas d'usage:**

- Vérifier composition dev layer
- Comparer avec ProductionLayer
- Identifier layers de test/mock

---

### 2. ProductionLayer

**Query:**

```bash
ast-grep --pattern 'export const ProductionLayer = $$$' \
         apps/server/src/composition/layers/production.layer.ts
```

**Cas d'usage:**

- Auditer différences avec DevelopmentLayer
- Vérifier configuration prod (secrets, monitoring, etc.)

---

### 3. TestLayer

**Query:**

```bash
ast-grep --pattern 'export const TestLayer = $$$' \
         apps/server/src/composition/layers/test.layer.ts
```

**Cas d'usage:**

- Identifier mocks et test doubles
- Vérifier isolation des tests

---

## Patterns Transversaux

### 1. Tous les Exports

**Query:**

```bash
ast-grep --pattern 'export const $NAME = $$$' apps/server/src
```

**Cas d'usage:**

- Générer un index de tous les exports
- Identifier exports non utilisés

---

### 2. Tous les Imports d'Effect

**Query:**

```bash
ast-grep --pattern "import * as $NAME from 'effect'" apps/server/src
```

**Cas d'usage:**

- Vérifier cohérence aliasing (S, Effect, Data, etc.)
- Auditer imports effect

---

### 3. Tous les Pipe Chains

**Query:**

```bash
ast-grep --pattern '$$.pipe($$$)' apps/server/src
```

**Cas d'usage:**

- Identifier patterns de composition
- Trouver pipe chains très longues (candidats pour refactor)

---

## Tips pour Queries Complexes

### Combiner Patterns

ast-grep ne supporte pas AND/OR nativement, mais on peut combiner avec shell:

```bash
# Trouver Effect.gen qui yield* un service spécifique
ast-grep --pattern 'Effect.gen(function* () { $$$ })' apps/server/src/application | \
  grep -A 10 "yield\* PilotProductRepository"
```

### Exporter en JSON

```bash
ast-grep --pattern 'S.TaggedStruct($NAME, { $$$ })' \
         --json \
         apps/server/src/domain | \
  jq -r '.[].matches[].metaVariables.NAME.value'
```

Utile pour extraire juste les noms des aggregates.

### Scope avec Globs

```bash
# Uniquement aggregate.ts
ast-grep --pattern 'PATTERN' apps/server/src/domain/**/aggregate.ts

# Uniquement handlers
ast-grep --pattern 'PATTERN' apps/server/src/**/*.handler.ts
```

---

## Résumé des Patterns Clés

| Pattern     | Query                              | Couche         |
| ----------- | ---------------------------------- | -------------- |
| Aggregate   | `S.TaggedStruct($NAME, { $$$ })`   | Domain         |
| Branded ID  | `S.String.pipe(S.brand($BRAND))`   | Domain         |
| Union       | `S.Union($$$)`                     | Domain         |
| Error       | `Data.TaggedError($TAG)`           | Domain         |
| Constructor | `Data.case<$TYPE>()`               | Domain         |
| Handler     | `Effect.gen(function* () { $$$ })` | Application    |
| Dependency  | `yield* $SERVICE`                  | Application    |
| Validation  | `S.transformOrFail($$$)`           | Application    |
| Port        | `Context.Tag($TAG)`                | Ports          |
| Layer impl  | `Layer.effect($TAG, $IMPL)`        | Infrastructure |
| Layer comp  | `Layer.mergeAll($$$)`              | Composition    |
