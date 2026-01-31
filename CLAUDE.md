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

### Key Patterns

**Aggregate with Schema** - Domain models use Effect Schema with `Data.case()` for immutability:

```typescript
const PilotProductSchema = S.TaggedStruct("PilotProduct", { ... })
export const MakePilotProduct = (params) => Data.case<PilotProduct>()({ _tag: "PilotProduct", ...params })
```

**Port as Context.Tag**:

```typescript
export class PilotProductRepository extends Context.Tag('PilotProductRepository')<
  PilotProductRepository,
  PilotProductRepositoryService
>() {}
```

**Adapter as Layer**:

```typescript
export const MongodbPilotProductRepositoryLive = Layer.effect(
  PilotProductRepository,
  Effect.map(MongoDatabase, (db) => createRepository(db))
)
```

**Command Handler with Effect.gen**:

```typescript
export const handleSomething = (command) =>
  Effect.gen(function* () {
    const repo = yield* SomeRepository
    const result = yield* repo.save(entity)
    return result
  })
```

### 3-Level Validation Flow

```
API Request → [API Schema] → Command DTO
→ [Application Schema] → Validated Data (branded types)
→ [Domain Schema] → Aggregate (full invariants)
```

## File Naming Conventions

| Pattern         | Example                                                           |
| --------------- | ----------------------------------------------------------------- |
| Aggregate       | `aggregate.ts`                                                    |
| Value Object    | `value-objects/{name}.ts`                                         |
| Command         | `{action}-{entity}.command.ts`                                    |
| Handler         | `{action}-{entity}.handler.ts`                                    |
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

Order: **Domain → Application → Infrastructure → Composition**

1. `domain/{context}/` - Define aggregate, value objects, events
2. `application/{context}/commands/` - Create command DTO
3. `application/{context}/handlers/` - Implement handler
4. `application/{context}/validation/` - Add validation schemas
5. `ports/driven/` - Add interface if new service needed
6. `infrastructure/` - Implement adapter (HTTP handler, repository)
7. `composition/layers/` - Wire in appropriate layer
8. Write tests

## Infrastructure

- **MongoDB**: `localhost:27017` (Mongo Express UI: `8081`)
- **RabbitMQ**: `localhost:5672` (Management UI: `15672`)
- **Server**: port `3001`

Collections: `pilot_products` (write), `catalog_products` (read)

## Reference Documentation

For detailed patterns and code examples, see [CONTEXT.md](CONTEXT.md) which contains:

- Complete architectural reference
- Code patterns with examples
- Navigation by feature
- Architectural decision records (ADRs)
