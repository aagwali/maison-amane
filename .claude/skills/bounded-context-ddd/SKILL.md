---
name: bounded-context-ddd
description: Crée un nouveau Bounded Context DDD complet avec architecture hexagonale. Utiliser pour créer un nouvel espace métier isolé (domain + application + ports + infrastructure).
---

# Bounded Context Creator

## Quand utiliser ce skill

- "Créer un nouveau bounded context pour [domaine]"
- "Ajouter un nouveau module métier [nom]"
- "Mettre en place un nouveau contexte DDD [nom]"

## Contexte nécessaire

Avant de générer, demander :

1. **Nom du bounded context** (ex: `order`, `inventory`, `customer`)
2. **Type de modèle** : Write Model (mutations) ou Read Model (projections)
3. **Aggregate root principal** et ses invariants métier
4. **Events émis** par ce contexte

## Workflow

### 1. Analyse

Avant de générer :

- Identifier les entités et value objects nécessaires
- Définir les invariants métier (règles qui doivent toujours être vraies)
- Lister les commandes (write) ou queries (read) du contexte
- Identifier les events à émettre ou consommer

### 2. Génération

Structure de dossiers à créer :

```
apps/server/src/
├── domain/{context}/
│   ├── aggregate.ts            # Aggregate root
│   ├── entities/               # Entités du domaine
│   │   └── index.ts
│   ├── value-objects/          # Value Objects
│   │   ├── ids.ts              # IDs brandés
│   │   ├── {vo-name}.ts
│   │   └── index.ts
│   ├── events.ts               # Domain events
│   ├── errors.ts               # Erreurs domaine typées
│   ├── enums.ts                # Énumérations
│   ├── services/               # Domain services (state machines)
│   │   └── index.ts
│   └── index.ts                # Barrel export
├── application/{context}/
│   ├── commands/               # Command DTOs
│   │   └── index.ts
│   ├── handlers/               # Command/Query handlers
│   │   └── index.ts
│   ├── validation/             # Schemas de transformation
│   │   └── index.ts
│   └── index.ts
├── ports/driven/repositories/
│   └── {entity}.repository.ts  # Interface repository
└── infrastructure/persistence/mongodb/
    └── {entity}.repository.ts  # Implémentation MongoDB
```

### 3. Validation

Checklist de création :

- [ ] Aggregate root avec `S.TaggedStruct` et `Data.case`
- [ ] Au moins un Value Object pour les IDs (branded type)
- [ ] Interface repository dans `ports/driven/`
- [ ] Erreurs typées avec `Data.TaggedError`
- [ ] Barrel exports (`index.ts`) pour chaque dossier
- [ ] Layer Effect pour l'injection de dépendances

## Patterns techniques

### Pattern 1 : Structure du Barrel Export (index.ts)

```typescript
// domain/{context}/index.ts
export * from './aggregate'
export * from './entities'
export * from './value-objects'
export * from './events'
export * from './errors'
export * from './enums'
export * from './services'
```

### Pattern 2 : Erreurs domaine typées

```typescript
// domain/{context}/errors.ts
import { Data } from 'effect'

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly field: string
  readonly message: string
  readonly details?: unknown
}> {}

export class InvariantViolation extends Data.TaggedError("InvariantViolation")<{
  readonly rule: string
  readonly message: string
}> {}

export class EntityNotFound extends Data.TaggedError("EntityNotFound")<{
  readonly entityType: string
  readonly id: string
}> {}

// Union pour le type d'erreur du contexte
export type {Context}Error = ValidationError | InvariantViolation | EntityNotFound
```

### Pattern 3 : Énumérations typées

```typescript
// domain/{context}/enums.ts
import * as S from 'effect/Schema'

export enum {Entity}Status {
  DRAFT = "draft",
  ACTIVE = "active",
  ARCHIVED = "archived",
}

export const {Entity}StatusSchema = S.Enums({Entity}Status)
```

### Pattern 4 : IDs brandés

```typescript
// domain/{context}/value-objects/ids.ts
import * as S from 'effect/Schema'

export const {Entity}IdSchema = S.String.pipe(S.brand("{Entity}Id"))
export type {Entity}Id = typeof {Entity}IdSchema.Type

export const Make{Entity}Id = S.decodeUnknownSync({Entity}IdSchema)
```

## Exemple complet

Création d'un bounded context `order` pour la gestion de commandes :

### 1. Domain Layer

```typescript
// domain/order/value-objects/ids.ts
import * as S from 'effect/Schema'

export const OrderIdSchema = S.String.pipe(S.brand('OrderId'))
export type OrderId = typeof OrderIdSchema.Type
export const MakeOrderId = S.decodeUnknownSync(OrderIdSchema)

export const OrderLineIdSchema = S.String.pipe(S.brand('OrderLineId'))
export type OrderLineId = typeof OrderLineIdSchema.Type
```

```typescript
// domain/order/enums.ts
import * as S from 'effect/Schema'

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export const OrderStatusSchema = S.Enums(OrderStatus)
```

```typescript
// domain/order/aggregate.ts
import { Data } from 'effect'
import * as S from 'effect/Schema'
import { OrderIdSchema } from './value-objects'
import { OrderStatusSchema } from './enums'
import { OrderLineSchema } from './entities'

const OrderSchema = S.TaggedStruct('Order', {
  id: OrderIdSchema,
  customerId: CustomerIdSchema,
  lines: S.NonEmptyArray(OrderLineSchema), // Invariant: au moins 1 ligne
  status: OrderStatusSchema,
  totalAmount: S.Number,
  createdAt: S.Date,
  updatedAt: S.Date,
})

export type Order = typeof OrderSchema.Type

export const MakeOrder = (params: Omit<Order, '_tag'>): Order =>
  Data.case<Order>()({ _tag: 'Order', ...params })
```

```typescript
// domain/order/events.ts
import { Data } from 'effect'
import * as S from 'effect/Schema'
import { CorrelationIdSchema, UserIdSchema } from '../shared'
import { OrderIdSchema } from './value-objects'

const OrderCreatedSchema = S.TaggedStruct('OrderCreated', {
  orderId: OrderIdSchema,
  customerId: CustomerIdSchema,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type OrderCreated = typeof OrderCreatedSchema.Type

export const MakeOrderCreated = (params: Omit<OrderCreated, '_tag'>): OrderCreated =>
  Data.case<OrderCreated>()({ _tag: 'OrderCreated', ...params })
```

### 2. Application Layer

```typescript
// application/order/commands/create-order.command.ts
import { Data } from 'effect'
import type { CorrelationId, UserId } from '../../../domain/shared'

export interface CreateOrderCommand {
  readonly _tag: 'CreateOrderCommand'
  readonly customerId: string
  readonly lines: readonly { productId: string; quantity: number }[]
  readonly correlationId: CorrelationId
  readonly userId: UserId
  readonly timestamp: Date
}

export const MakeCreateOrderCommand = (
  params: Omit<CreateOrderCommand, '_tag'>
): CreateOrderCommand => Data.case<CreateOrderCommand>()({ _tag: 'CreateOrderCommand', ...params })
```

### 3. Port Repository

```typescript
// ports/driven/repositories/order.repository.ts
import { Context, Effect, Option } from 'effect'
import type { Order, OrderId } from '../../../domain/order'
import type { PersistenceError } from '../errors'

export interface OrderRepositoryService {
  readonly save: (order: Order) => Effect.Effect<Order, PersistenceError>
  readonly findById: (id: OrderId) => Effect.Effect<Option.Option<Order>, PersistenceError>
  readonly update: (order: Order) => Effect.Effect<Order, PersistenceError>
}

export class OrderRepository extends Context.Tag('OrderRepository')<
  OrderRepository,
  OrderRepositoryService
>() {}
```

## Checklist de qualité

- [ ] Aggregate immuable via `Data.case()`
- [ ] Invariants documentés en commentaire
- [ ] IDs brandés (pas de `string` nu)
- [ ] Erreurs typées `TaggedError`
- [ ] Events avec `correlationId` et `userId`
- [ ] Repository interface dans `ports/driven/`
- [ ] Barrel exports pour chaque dossier
- [ ] Schemas Effect pour toutes les structures
