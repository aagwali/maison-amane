# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Maison Amane is a DDD-based e-commerce backend using **Effect-TS** with **Hexagonal Architecture** and **CQRS**. It's a **Turbo + pnpm monorepo** with:

- `apps/server` - Main Effect HTTP API
- `apps/consumers/catalog-projection` - Read model projector
- `apps/consumers/shopify-sync` - Shopify sync consumer
- `apps/docs` - Docusaurus documentation
- `packages/api` - Shared API contracts (routes, DTOs)
- `packages/shared-kernel` - Cross-cutting types and configs

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Watch mode all apps
pnpm build            # Build all
pnpm test             # Run tests (Vitest)
pnpm typecheck        # TypeScript validation
pnpm lint             # ESLint
pnpm format           # Prettier format all files
pnpm commit           # Interactive commit (Commitizen)
```

### Per-app commands (run from app directory)

```bash
pnpm test:watch       # Watch mode tests
pnpm test:coverage    # Coverage report
```

## Architecture

```
Domain Layer (DDD)
    ↕
Ports (Context.Tag interfaces)
    ↕
Application Layer (CQRS handlers, validation)
    ↕
Infrastructure Layer (MongoDB, RabbitMQ, HTTP)
    ↕
Composition Layer (Effect Layers for DI)
```

### Bounded Contexts

| Context     | Type        | Location                |
| ----------- | ----------- | ----------------------- |
| **Pilot**   | Write Model | Product creation/update |
| **Catalog** | Read Model  | UI-optimized projection |
| **Shopify** | Integration | External sync           |

### Key Patterns (quick rules — see [CONTEXT.md](CONTEXT.md) for full examples)

- **Aggregate**: `S.TaggedStruct` + `Data.case()` constructor in camelCase (`makePilotProduct`, NOT `MakePilotProduct`)
- **Aggregate Methods**: Pure functions `(aggregate, ...args) => Effect<Aggregate, Error>`
- **Domain Events**: Must include `_version: S.Literal(N)`, constructor omits `_tag` and `_version`
- **Ports**: `Context.Tag` interfaces — `getById` (fails if absent) vs `findById` (returns Option)
- **Adapters**: Implemented as `Layer` — MongoDB via `createRepositoryLayer`, in-memory via `Layer.succeed`
- **Handlers**: Named `{entity}{Action}Handler` (e.g. `pilotProductCreationHandler`), use selective imports (`import { gen } from 'effect/Effect'`)
- **Validation**: 3 levels — API Schema → Application Schema (branded types) → Domain Schema (full invariants)

## File Naming Conventions

| Pattern         | Example                                                           |
| --------------- | ----------------------------------------------------------------- |
| Aggregate       | `aggregate.ts`                                                    |
| Value Object    | `value-objects/{name}.ts`                                         |
| Command         | `{action}-{entity}.command.ts`                                    |
| Handler         | `{action}-{entity}.handler.ts`                                    |
| Query           | `{action}-{entity}.query.ts`                                      |
| Repository Port | `{entity}.repository.ts` in `ports/driven/`                       |
| Repository Impl | `{entity}.repository.ts` in `infrastructure/persistence/mongodb/` |
| Layer           | `{name}.layer.ts`                                                 |

## ESLint Rules for Effect-TS

Custom rules adapted for Effect patterns:

- Variables ending in `Schema` exempted from `no-unused-vars`
- `no-redeclare` disabled (same name for type and const is Effect Schema pattern)
- `require-yield` disabled (Effect generators pattern)

## Commit Convention

Uses Conventional Commits. Valid scopes:

- Apps: `server`, `client`, `catalog-projection`, `shopify-sync`, `docs`
- Packages: `api`, `shared-kernel`
- Special: `root`, `deps`, `release`, `monorepo`

## Development Workflow: Adding a Feature

Order: **Domain → Application → Infrastructure → Composition → Tests**

See [CONTEXT.md §6](CONTEXT.md#6-workflows-de-développement) for detailed step-by-step with file paths.

## Infrastructure

- **MongoDB**: `localhost:27017` (Mongo Express UI: `8081`)
- **RabbitMQ**: `localhost:5672` (Management UI: `15672`)
- **Server**: port `3001`

Collections: `pilot_products` (write), `catalog_products` (read)

## Utilisation des Skills

Avant de commencer une tâche de développement, **vérifiez si un skill peut vous assister**. Les skills contiennent les workflows, règles et références pour les tâches récurrentes.

### Skills disponibles

- **`domain-model`** -- Modélisation domaine DDD (aggregates, VOs, events, errors, services)
- **`use-case`** -- Use cases applicatifs CQRS (commands, queries, handlers, validation)
- **`infra-adapter`** -- Adapters infrastructure (repositories, services, messaging)
- **`api-endpoint`** -- Endpoints HTTP + contrats API (routes, DTOs, error mapping)
- **`test-suite`** -- Tests (test doubles, fixtures, tests intégration/unitaires)
- **`bounded-context`** -- Scaffolding complet d'un nouveau Bounded Context
- **`consumer`** -- Consumer RabbitMQ (apps/consumers/)
- **`shared-kernel`** -- Types partagés cross-context (IDs, enums, messaging topology, configs infrastructure)

### Workflow recommandé

```
Vous : "Je veux [décrire la tâche complète]. Quels skills utiliser ?"
Claude : "Je recommande [liste des skills]. Je vais les lire et les appliquer."
[Claude lit les SKILL.md pertinents et suit leurs instructions]
```

**Exemples** :

- "Ajouter un champ `priority` à PilotProduct" -> `domain-model`, `use-case`, `api-endpoint`, `test-suite`
- "Créer le bounded context Production" -> `bounded-context` (orchestre tous les autres)
- "Ajouter un endpoint GET /products/:id" -> `use-case`, `api-endpoint`, `test-suite`

## Maintenance des artefacts de documentation

### Mise à jour des Skills

Lors d'un refacto modifiant les conventions (naming, patterns transversaux), vérifier si les skills dans `.claude/skills/` référencent des règles impactées et les mettre à jour.

### Mise à jour de CONTEXT.md

Lors d'un changement architectural majeur (nouveau pattern, nouvelle couche, nouveau BC), mettre à jour `CONTEXT.md` pour refléter l'état actuel.

## Reference Documentation

For detailed patterns and code examples, see [CONTEXT.md](CONTEXT.md) which contains:

- Complete architectural reference
- Code patterns with examples
- Navigation by feature
- Architectural decision records (ADRs)
