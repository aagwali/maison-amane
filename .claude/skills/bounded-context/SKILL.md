---
name: bounded-context
description: 'Crée un nouveau Bounded Context DDD complet avec architecture hexagonale et Effect-TS : domain + application + ports + infrastructure + tests. Skill orchestrateur qui utilise domain-model, use-case, infra-adapter, api-endpoint, test-suite, consumer. Utiliser quand: (1) Créer un nouveau bounded context, (2) Créer un nouveau module métier, (3) Créer le contexte [nom], (4) Scaffolder un BC complet, (5) Créer un nouveau BC, (6) Créer un nouveau contexte DDD, (7) Créer un nouveau domaine métier, (8) New bounded context, (9) New business module, (10) Create context [name], (11) Scaffold a BC, (12) Create a new BC, (13) New DDD context, (14) New business domain.'
---

# Bounded Context Skill

Meta-skill that orchestrates `domain-model`, `use-case`, `infra-adapter`, `api-endpoint`, `test-suite`, and `consumer` to scaffold a complete bounded context.

## Prerequisites

Before starting, clarify with the user:

- Context name (e.g., `production`, `livraison`)
- Main aggregate name and its fields
- Key business operations (create, update, state transitions)
- Whether a read model consumer is needed

## Orchestrated Workflow

### Step 0 — Communication Design (before coding)

Avant de coder, déterminer comment ce BC communiquera avec les autres :

1. **Ce BC publie des events ?** → Ajouter un exchange + routing keys dans `@maison-amane/shared-kernel` (skill `shared-kernel`)
2. **Ce BC réagit aux events d'autres BC ?** → Créer un consumer (skill `consumer`)
3. **Quel pattern de communication ?** (cf. ADR-7) :

| Besoin                              | Pattern                        | Action                                                                 |
| ----------------------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| Notifier sans attendre de résultat  | Choreography (fire-and-forget) | Publisher dans le BC + consumer dans le BC cible                       |
| Notifier et suivre le résultat      | Choreography avec suivi        | Publisher + SyncStatus-like dans l'aggregate + consumer pour le retour |
| Workflow multi-BC avec compensation | Saga                           | Process manager à concevoir (pas encore implémenté)                    |

4. **Shared-kernel impacté ?** → Vérifier si de nouveaux IDs, enums ou routing keys doivent être ajoutés (skill `shared-kernel`, cf. ADR-9)

### Step 1 — Domain Layer (skill: `domain-model`)

1. Create `domain/{context}/value-objects/ids.ts` — branded IDs
2. Create `domain/{context}/value-objects/scalar-types.ts` — branded scalars
3. Create `domain/{context}/value-objects/` — any tagged unions, structured VOs
4. Create `domain/{context}/enums.ts` — enumerations
5. Create `domain/{context}/errors.ts` — domain errors
6. Create `domain/{context}/events.ts` — versioned domain events
7. Create `domain/{context}/aggregate.ts` — root entity + methods
8. Create `domain/{context}/services/` — domain services if needed
9. Create `domain/{context}/reference-data.ts` — lookup tables if needed
10. Create `domain/{context}/index.ts` — barrel exports

### Step 2 — Application Layer (skill: `use-case`)

1. Create `application/{context}/commands/create-{entity}.command.ts`
2. Create `application/{context}/commands/update-{entity}.command.ts`
3. Create `application/{context}/queries/get-{entity}.query.ts`
4. Create `application/{context}/validation/{entity}-data.schema.ts`
5. Create `application/{context}/validation/update-{entity}-data.schema.ts`
6. Create `application/{context}/mappers/{entity}.mapper.ts` if needed
7. Create `application/{context}/handlers/create-{entity}.handler.ts`
8. Create `application/{context}/handlers/update-{entity}.handler.ts`
9. Create `application/{context}/handlers/get-{entity}.handler.ts`
10. Create barrel exports at each level

### Step 3 — Ports Layer (skill: `infra-adapter`)

1. Create `ports/driven/repositories/{entity}.repository.ts` — Context.Tag interface

### Step 4 — Infrastructure Layer (skill: `infra-adapter`)

1. Create `infrastructure/persistence/mongodb/mappers/{entity}.mapper.ts`
2. Create `infrastructure/persistence/mongodb/{entity}.repository.ts` + Layer
3. Create `infrastructure/persistence/in-memory/{entity}.repository.ts` + Layer

### Step 5 — API Layer (skill: `api-endpoint`)

1. Add endpoint paths in `packages/api/src/endpoints.ts`
2. Add group in `packages/api/src/routes.ts`
3. Create `packages/api/src/dtos/{entity}.request.ts`
4. Create `packages/api/src/dtos/{entity}.response.ts`
5. Add error codes if new error types
6. Create `infrastructure/http/handlers/{entity}.handler.ts`
7. Create `infrastructure/http/mappers/{entity}-problem-detail.mapper.ts`

### Step 6 — Composition Layer

1. Create `composition/layers/{context}.layer.ts` — wire all dependencies
2. Integrate into server main composition

### Step 7 — Tests (skill: `test-suite`)

1. Create domain unit tests (`aggregate.test.ts`, service tests)
2. Create handler integration tests (create, update, get)
3. Create validation tests if complex transforms

### Step 8 — Consumer (optional, skill: `consumer`)

1. Create `apps/consumers/{context}-projection/` if read model needed
2. Add routing keys in shared-kernel
3. Create message handler
4. Create `main.ts` with `bootstrapConsumer`

## Directory Structure

See [references/structure.md](references/structure.md) for the complete directory tree template.

## Skills Used (in order)

| Order | Skill           | Purpose                                   |
| ----- | --------------- | ----------------------------------------- |
| 1     | `domain-model`  | Aggregates, VOs, events, errors, services |
| 2     | `use-case`      | Commands, queries, handlers, validation   |
| 3     | `infra-adapter` | Ports, repositories, layers               |
| 4     | `api-endpoint`  | HTTP routes, DTOs, error mapping          |
| 5     | `test-suite`    | Unit + integration tests                  |
| 6     | `consumer`      | RabbitMQ consumer (optional)              |

## Full Checklist

### Domain

- [ ] Branded IDs created
- [ ] Value objects created
- [ ] Enums created
- [ ] Errors created (TaggedError, context-specific names)
- [ ] Events created with `_version: S.Literal(1)`
- [ ] Aggregate created with methods (pure functions)
- [ ] Domain services created if needed
- [ ] Barrel export `index.ts`

### Application

- [ ] Create command DTO
- [ ] Update command DTO
- [ ] Query DTOs (`Data.case`)
- [ ] Create validation schema
- [ ] Update validation schema (Option fields)
- [ ] Mappers (validated → domain)
- [ ] Create handler
- [ ] Update handler
- [ ] Query handler(s)
- [ ] Barrel exports

### Infrastructure

- [ ] Repository port (Context.Tag)
- [ ] MongoDB repository + mapper
- [ ] In-memory repository
- [ ] Layers (Live + Test)

### API

- [ ] Endpoint paths added
- [ ] Route group declared
- [ ] Request DTOs
- [ ] Response DTOs
- [ ] Error codes added
- [ ] HTTP handler implemented
- [ ] Error mapper (domain → RFC 7807)

### Tests

- [ ] Domain unit tests
- [ ] Handler integration tests
- [ ] Validation tests (if complex)

### Consumer (if needed)

- [ ] App structure created
- [ ] Routing keys added
- [ ] Handler implemented
- [ ] Layers composed
- [ ] `main.ts` with `bootstrapConsumer`
