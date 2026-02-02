---
name: domain-modeling
description: |
  Modélise aggregates, entities et value objects avec Effect Schema et Data.case.
  Utiliser quand: (1) Créer un aggregate root, (2) Définir des value objects (branded types, unions), (3) Modéliser des domain events, (4) Créer une state machine.
  Patterns: S.TaggedStruct, S.brand, S.Union, Data.case, Data.TaggedError.
---

# Domain Modeling avec Effect

## Arbre de décision

```
Quel type de structure ?
│
├─ Identité unique + invariants + cycle de vie
│  └─ AGGREGATE ROOT → references/aggregates.md
│
├─ Valeur primitive distinguée au niveau type
│  └─ BRANDED TYPE → references/value-objects.md
│
├─ Objet composé sans identité
│  └─ VALUE OBJECT (Struct) → references/value-objects.md
│
├─ Plusieurs états possibles (state machine)
│  └─ UNION DISCRIMINÉE → references/unions.md
│
├─ Fait métier à notifier
│  └─ DOMAIN EVENT → references/events.md
│
└─ Transitions d'état avec guards
   └─ STATE MACHINE → references/state-machines.md
```

## Patterns rapides

### Branded Type (ID)

```typescript
export const OrderIdSchema = S.String.pipe(S.brand('OrderId'))
export type OrderId = typeof OrderIdSchema.Type
export const MakeOrderId = S.decodeUnknownSync(OrderIdSchema)
```

### Aggregate Root

```typescript
const OrderSchema = S.TaggedStruct('Order', {
  id: OrderIdSchema,
  lines: S.NonEmptyArray(OrderLineSchema), // invariant
  status: OrderStatusSchema,
  createdAt: S.Date,
  updatedAt: S.Date,
})
export type Order = typeof OrderSchema.Type
export const MakeOrder = (params: Omit<Order, '_tag'>): Order =>
  Data.case<Order>()({ _tag: 'Order', ...params })
```

### Union discriminée

```typescript
const PendingSchema = S.TaggedStruct('Pending', {})
const CompletedSchema = S.TaggedStruct('Completed', { completedAt: S.Date })
export const StatusSchema = S.Union(PendingSchema, CompletedSchema)
```

### Domain Event

```typescript
const OrderCreatedSchema = S.TaggedStruct('OrderCreated', {
  orderId: OrderIdSchema,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})
export const MakeOrderCreated = (params) =>
  Data.case<OrderCreated>()({ _tag: 'OrderCreated', ...params })
```

## Structure de fichiers

```
domain/{context}/
├── aggregate.ts              # Aggregate root
├── value-objects/
│   ├── ids.ts                # Branded types (IDs)
│   ├── {concept}.ts          # Autres VOs
│   └── index.ts
├── events.ts                 # Domain events
├── errors.ts                 # Data.TaggedError
├── enums.ts                  # S.Enums()
├── services/                 # State machines
└── index.ts
```

## Références détaillées

- [Aggregates](references/aggregates.md) - Pattern complet avec invariants
- [Value Objects](references/value-objects.md) - Branded types, structs, scalaires
- [Unions discriminées](references/unions.md) - S.Union + TaggedStruct
- [Domain Events](references/events.md) - Structure et metadata
- [State Machines](references/state-machines.md) - Guards et transitions
