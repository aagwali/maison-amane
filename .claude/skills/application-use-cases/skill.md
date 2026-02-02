---
name: application-use-cases
description: |
  Crée des command handlers (write) et query handlers (read) avec Effect-TS et pattern CQRS.
  Utiliser quand: (1) Implémenter un use case métier, (2) Créer un command handler avec validation, (3) Créer une query, (4) Ajouter des validation schemas avec S.transformOrFail.
  Patterns: Effect.gen, S.transformOrFail, Command DTO, Error handling.
---

# Application Use Cases (CQRS)

## Arbre de décision

```
Quel type d'opération ?
│
├─ Mutation (créer, modifier, supprimer)
│  └─ COMMAND HANDLER → references/command-handlers.md
│
├─ Lecture (get, list, search)
│  └─ QUERY HANDLER → references/query-handlers.md
│
├─ Transformation API → Domain
│  └─ VALIDATION SCHEMA → references/validation-schemas.md
│
└─ Réaction à un event (projection)
   └─ EVENT HANDLER → references/event-handlers.md
```

## Génération rapide

```bash
# Command handler
python .claude/skills/ddd-feature-complete/scripts/generate_handler.py create Order order --type=command

# Query handler
python .claude/skills/ddd-feature-complete/scripts/generate_handler.py get Order order --type=query
```

## Pattern Command Handler (résumé)

```typescript
export const handleCreateOrder = (
  command: CreateOrderCommand
): Effect.Effect<
  Order, // Retour succès
  OrderValidationError, // Erreurs possibles
  OrderRepository | Clock // Dépendances
> =>
  Effect.gen(function* () {
    // 1. Validation
    const validated = yield* validateOrderData(command.data)

    // 2. Business logic
    const order = yield* createAggregate(validated)

    // 3. Persistence
    const repo = yield* OrderRepository
    return yield* repo.save(order)
  })
```

## Pattern Query Handler (résumé)

```typescript
export const getOrderById = (id: OrderId): Effect.Effect<Order, OrderNotFound, OrderRepository> =>
  Effect.gen(function* () {
    const repo = yield* OrderRepository
    const maybeOrder = yield* repo.findById(id)

    return yield* Option.match(maybeOrder, {
      onNone: () => Effect.fail(new OrderNotFound({ id: String(id) })),
      onSome: Effect.succeed,
    })
  })
```

## Pattern Validation Schema (résumé)

```typescript
export const ValidatedVariantSchema = S.transformOrFail(
  UnvalidatedVariantSchema, // Input (strings)
  ValidatedVariantSchema, // Output (branded types)
  {
    decode: (input) => {
      // Logique conditionnelle
      if (input.size === 'CUSTOM') {
        return validateCustomVariant(input)
      }
      return validateStandardVariant(input)
    },
    encode: (validated) =>
      Effect.succeed({
        /* reverse */
      }),
  }
)
```

## Structure de fichiers

```
application/{context}/
├── commands/
│   ├── create-{entity}.command.ts   # DTO avec S.TaggedStruct
│   └── index.ts
├── handlers/
│   ├── create-{entity}.handler.ts   # Effect.gen + dépendances
│   ├── create-{entity}.handler.test.ts
│   └── index.ts
├── queries/
│   ├── get-{entity}.query.ts
│   └── index.ts
├── validation/
│   ├── {entity}-input.schema.ts     # S.transformOrFail
│   └── index.ts
└── index.ts
```

## Flux de validation 3 niveaux

```
API Request
    │
    ▼ [API Schema - packages/api]
Command DTO (strings, raw types)
    │
    ▼ [Application Schema - S.transformOrFail]
Validated Data (enums, branded types)
    │
    ▼ [Domain Schema - aggregate]
Domain Aggregate (invariants complets)
```

## Références détaillées

- [Command Handlers](references/command-handlers.md) - Pattern complet avec events
- [Query Handlers](references/query-handlers.md) - Get, List, Search
- [Validation Schemas](references/validation-schemas.md) - S.transformOrFail
- [Event Handlers](references/event-handlers.md) - Projections et consumers
