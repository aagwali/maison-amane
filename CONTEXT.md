# CONTEXT.md - Maison Amane

> Référence architecturale pour toutes les conversations futures.

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Structure du projet](#2-structure-du-projet)
3. [Patterns techniques](#3-patterns-techniques)
4. [Navigation par fonctionnalité](#4-navigation-par-fonctionnalité)
5. [Décisions architecturales](#5-décisions-architecturales)
6. [Workflows de développement](#6-workflows-de-développement)
7. [Référence rapide](#7-référence-rapide)

---

## 1. Vue d'ensemble

### Type de projet

**Monorepo Turbo + pnpm** composé de :

- 4 applications (`apps/`)
- 2 packages partagés (`packages/`)

### Stack technique

| Catégorie       | Technologie        | Version     |
| --------------- | ------------------ | ----------- |
| Runtime         | Node.js            | >= 18       |
| Package Manager | pnpm               | 9.0.0       |
| Build           | Turbo              | 2.4.2       |
| Core Framework  | Effect-TS          | 3.13.1      |
| HTTP            | @effect/platform   | -           |
| Base de données | MongoDB            | 6.12.0      |
| Message Broker  | RabbitMQ (amqplib) | 0.10.9      |
| Tests           | Vitest             | -           |
| Linting         | ESLint + Prettier  | 9.x / 3.5.0 |

### Architecture globale

```
┌─────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE HEXAGONALE                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    DOMAIN LAYER (DDD)                   │ │
│  │  • Aggregates (PilotProduct)                           │ │
│  │  • Value Objects (ProductId, SyncStatus, etc.)         │ │
│  │  • Domain Events (PilotProductPublished)               │ │
│  │  • Domain Services (SyncStatusMachine)                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↕                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                PORTS (Driven - Interfaces)              │ │
│  │  • Repository, EventPublisher, Clock, IdGenerator      │ │
│  │  • External Services (ShopifyClient)                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↕                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   APPLICATION LAYER                     │ │
│  │  • Command Handlers (CQRS Write)                       │ │
│  │  • Query Handlers (CQRS Read)                          │ │
│  │  • Validation Schemas                                   │ │
│  │  • Mappers (Domain ↔ DTO)                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↕                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  INFRASTRUCTURE LAYER                   │ │
│  │  • HTTP (@effect/platform)                             │ │
│  │  • MongoDB Repositories                                 │ │
│  │  • RabbitMQ Publisher/Consumer                         │ │
│  │  • External APIs (Shopify)                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Bounded Contexts (DDD)

| Context     | Type        | Responsabilité                                                        |
| ----------- | ----------- | --------------------------------------------------------------------- |
| **Pilot**   | Write Model | Gestion des produits pilotes (création, mise à jour, synchronisation) |
| **Catalog** | Read Model  | Projection simplifiée pour l'UI du catalogue                          |
| **Shopify** | Integration | Synchronisation externe vers Shopify                                  |

---

## 2. Structure du projet

### Arborescence racine

```
maison-amane/
├── apps/
│   ├── server/              # API principale (Effect HTTP)
│   ├── client/              # Frontend (placeholder)
│   ├── consumers/           # Message consumers (Driving adapters)
│   │   ├── catalog-projection/  # Consumer: projection read model
│   │   └── shopify-sync/        # Consumer: sync Shopify
│   └── docs/                # Documentation Docusaurus
├── packages/
│   ├── api/                 # Contrats API partagés (DTOs, routes)
│   └── shared-kernel/       # Types transverses (CorrelationId, configs)
├── package.json             # Workspace root
├── turbo.json               # Configuration Turbo
└── pnpm-workspace.yaml      # Configuration pnpm
```

### Structure apps/server/src (application principale)

```
src/
├── main.ts                          # Point d'entrée
├── domain/                          # ══════ COUCHE DOMAINE ══════
│   ├── pilot/                       # Bounded Context: Pilot Product
│   │   ├── aggregate.ts             # Aggregate root
│   │   ├── entities/                # Entités du domaine
│   │   ├── value-objects/           # VOs (ids, scalar-types, sync-status)
│   │   ├── events.ts                # Domain events
│   │   ├── errors.ts                # Erreurs domaine
│   │   ├── enums.ts                 # Énumérations
│   │   ├── services/                # Domain services
│   │   └── policies/                # Business rules (placeholder)
│   ├── catalog/                     # Bounded Context: Catalog (Read Model)
│   │   ├── projections/             # Read model schemas
│   │   └── events.ts                # Projection events
│   └── shared/                      # Types partagés entre contexts
├── application/                     # ══════ COUCHE APPLICATION ══════
│   ├── pilot/
│   │   ├── commands/                # DTOs de commande
│   │   ├── handlers/                # Command handlers (CQRS)
│   │   └── validation/              # Schemas de validation
│   ├── catalog/
│   │   ├── handlers/                # Projection handlers
│   │   ├── projectors/              # Logique de transformation
│   │   └── queries/                 # Query handlers
│   └── shopify/
│       ├── handlers/                # Sync handlers
│       ├── mappers/                 # Domain → Shopify DTO
│       └── dtos/                    # Shopify DTOs
├── infrastructure/                  # ══════ COUCHE INFRASTRUCTURE ══════
│   ├── http/
│   │   ├── handlers/                # HTTP route handlers (Driving adapters)
│   │   └── mappers/                 # Error/Response mappers
│   ├── messaging/
│   │   └── rabbitmq/                # RabbitMQ publisher (Driven adapter)
│   ├── persistence/
│   │   ├── mongodb/                 # MongoDB repositories (Driven adapters)
│   │   └── in-memory/               # Test repositories
│   └── services/                    # Service implementations (Clock, IdGenerator)
├── ports/                           # ══════ PORTS HEXAGONAUX ══════
│   ├── driven/                      # Ce dont le domaine dépend
│   │   ├── repositories/            # Interfaces repository
│   │   ├── services/                # Interfaces services (Clock, IdGenerator, etc.)
│   │   └── errors.ts                # Erreurs persistence
│   └── driving/                     # (Placeholder - non utilisé actuellement)
├── composition/                     # ══════ INJECTION DE DÉPENDANCES ══════
│   ├── config/                      # Configuration (env vars)
│   └── layers/                      # Effect Layers
└── test-utils/                      # Helpers de test
```

### Conventions de nommage

| Pattern         | Convention                               | Exemple                           |
| --------------- | ---------------------------------------- | --------------------------------- |
| Aggregate       | `{name}.aggregate.ts` ou `aggregate.ts`  | `aggregate.ts`                    |
| Value Object    | `{name}.ts` dans `value-objects/`        | `sync-status.ts`                  |
| Repository Port | `{entity}.repository.ts`                 | `pilot-product.repository.ts`     |
| Repository Impl | `{entity}.repository.ts` dans `mongodb/` | Même nom, dossier différent       |
| Command         | `{action}-{entity}.command.ts`           | `create-pilot-product.command.ts` |
| Handler         | `{action}-{entity}.handler.ts`           | `create-pilot-product.handler.ts` |
| Event           | `events.ts` par context                  | `domain/pilot/events.ts`          |
| Schema          | `{name}.schema.ts`                       | `variant-input.schema.ts`         |
| Layer           | `{name}.layer.ts`                        | `development.layer.ts`            |
| Mapper          | `{entity}.mapper.ts`                     | `pilot-product.mapper.ts`         |

---

## 3. Patterns techniques

### 3.1 Aggregate Root (DDD)

```typescript
// apps/server/src/domain/pilot/aggregate.ts

import { Data } from 'effect'
import * as S from 'effect/Schema'

// Schema définit la structure et les contraintes
const PilotProductSchema = S.TaggedStruct('PilotProduct', {
  id: ProductIdSchema,
  label: ProductLabelSchema,
  type: ProductTypeSchema,
  category: ProductCategorySchema,
  description: ProductDescriptionSchema,
  priceRange: PriceRangeSchema,
  variants: S.NonEmptyArray(ProductVariantSchema), // Invariant: au moins 1
  views: ProductViewsSchema,
  status: ProductStatusSchema,
  syncStatus: SyncStatusSchema,
  createdAt: S.Date,
  updatedAt: S.Date,
})

export type PilotProduct = typeof PilotProductSchema.Type

// Constructeur immuable via Data.case
export const MakePilotProduct = (params: Omit<PilotProduct, '_tag'>): PilotProduct =>
  Data.case<PilotProduct>()({ _tag: 'PilotProduct', ...params })
```

### 3.2 Value Object avec Schema

```typescript
// apps/server/src/domain/pilot/value-objects/sync-status.ts

import { Data } from 'effect'
import * as S from 'effect/Schema'

// Union discriminée avec _tag
const NotSyncedSchema = S.TaggedStruct('NotSynced', {})
const SyncedSchema = S.TaggedStruct('Synced', {
  shopifyProductId: ShopifyProductIdSchema,
  syncedAt: S.Date,
})
const SyncFailedSchema = S.TaggedStruct('SyncFailed', {
  error: SyncErrorSchema,
  failedAt: S.Date,
  attempts: S.Number,
})

export const SyncStatusSchema = S.Union(NotSyncedSchema, SyncedSchema, SyncFailedSchema)
export type SyncStatus = typeof SyncStatusSchema.Type

// Constructeurs
export const MakeNotSynced = (): NotSynced => Data.case<NotSynced>()({ _tag: 'NotSynced' })

export const MakeSynced = (params: Omit<Synced, '_tag'>): Synced =>
  Data.case<Synced>()({ _tag: 'Synced', ...params })
```

### 3.3 Branded Types (IDs)

```typescript
// apps/server/src/domain/pilot/value-objects/ids.ts

import * as S from 'effect/Schema'

// Brand garantit l'unicité du type au compile-time
export const ProductIdSchema = S.String.pipe(S.brand('ProductId'))
export type ProductId = typeof ProductIdSchema.Type

export const ShopifyProductIdSchema = S.String.pipe(S.brand('ShopifyProductId'))
export type ShopifyProductId = typeof ShopifyProductIdSchema.Type
```

### 3.4 Port (Interface Repository)

```typescript
// apps/server/src/ports/driven/repositories/pilot-product.repository.ts

import { Context, Effect, Option } from 'effect'

// Interface du service
export interface PilotProductRepositoryService {
  readonly save: (product: PilotProduct) => Effect.Effect<PilotProduct, PersistenceError>
  readonly findById: (id: ProductId) => Effect.Effect<Option.Option<PilotProduct>, PersistenceError>
  readonly update: (product: PilotProduct) => Effect.Effect<PilotProduct, PersistenceError>
}

// Context.Tag pour l'injection de dépendance
export class PilotProductRepository extends Context.Tag('PilotProductRepository')<
  PilotProductRepository,
  PilotProductRepositoryService
>() {}
```

### 3.5 Adapter (Implémentation Repository)

```typescript
// apps/server/src/infrastructure/persistence/mongodb/pilot-product.repository.ts

import { Effect, Layer } from 'effect'

const COLLECTION_NAME = 'pilot_products'

export const createMongodbPilotProductRepository = (db: Db): PilotProductRepositoryService => {
  const collection = db.collection<PilotProductDocument>(COLLECTION_NAME)

  return {
    save: (product) => insertDocument(collection, toDocument(product), product),
    findById: (id) => findDocumentById(collection, id, fromDocument),
    update: (product) => replaceDocument(collection, product.id, toDocument(product), product),
  }
}

// Layer Effect pour fournir l'implémentation
export const MongodbPilotProductRepositoryLive = Layer.effect(
  PilotProductRepositoryTag,
  Effect.map(MongoDatabase, (db) => createMongodbPilotProductRepository(db))
)
```

### 3.6 Command Handler (CQRS)

```typescript
// apps/server/src/application/pilot/handlers/create-pilot-product.handler.ts

import { Effect } from 'effect'

export const handlePilotProductCreation = (
  command: PilotProductCreationCommand
): Effect.Effect<
  PilotProduct,
  PilotProductCreationError,
  PilotProductRepository | IdGenerator | EventPublisher | Clock
> =>
  Effect.gen(function* () {
    // 1. Validation
    const validated = yield* validateProductData(command.data)

    // 2. Création de l'agrégat
    const product = yield* createAggregate(validated)

    // 3. Persistance
    const repo = yield* PilotProductRepository
    const savedProduct = yield* repo.save(product)

    // 4. Émission d'événement (si publié)
    if (savedProduct.status === ProductStatus.PUBLISHED) {
      yield* emitEvent(savedProduct, command)
    }

    return savedProduct
  })
```

### 3.7 Domain Event

```typescript
// apps/server/src/domain/pilot/events.ts

import { Data } from 'effect'
import * as S from 'effect/Schema'

const PilotProductPublishedSchema = S.TaggedStruct('PilotProductPublished', {
  productId: ProductIdSchema,
  product: S.Any as S.Schema<PilotProduct>,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductPublished = typeof PilotProductPublishedSchema.Type

export const MakePilotProductPublished = (
  params: Omit<PilotProductPublished, '_tag'>
): PilotProductPublished =>
  Data.case<PilotProductPublished>()({ _tag: 'PilotProductPublished', ...params })
```

### 3.8 Composition Layer (DI)

```typescript
// apps/server/src/composition/layers/development.layer.ts

import { Layer } from 'effect'

// Composition des layers avec leurs dépendances
const PilotProductLayer = MongodbPilotProductRepositoryLive.pipe(Layer.provide(MongoDatabaseLive))

const RabbitMQPublisherLayer = RabbitMQEventPublisherLayer.pipe(Layer.provide(RabbitMQSetupLayer))

// Layer final pour le développement
export const DevelopmentLayer = Layer.mergeAll(
  PilotProductLayer,
  UuidIdGeneratorLive,
  SystemClockLive,
  RabbitMQPublisherLayer
)
```

### 3.9 Schema Transformation (Validation)

```typescript
// apps/server/src/application/pilot/validation/variant-input.schema.ts

import * as S from 'effect/Schema'

// Transformation: Input non validé → Domain validé
export const ValidatedVariantSchema: S.Schema<VariantBase, UnvalidatedVariant> = S.transformOrFail(
  UnvalidatedVariantSchema,
  S.typeSchema(VariantBaseSchema),
  {
    strict: true,
    decode: (input) => {
      if (input.size === Size.CUSTOM) {
        return S.decodeUnknown(CustomVariantTargetSchema)({
          _tag: 'CustomVariant',
          size: input.size,
          customDimensions: input.customDimensions,
          price: input.price,
        }).pipe(Effect.mapError((e) => e.issue))
      }
      return S.decodeUnknown(StandardVariantTargetSchema)({
        _tag: 'StandardVariant',
        size: input.size,
      }).pipe(Effect.mapError((e) => e.issue))
    },
    encode: (validated) => {
      /* ... */
    },
  }
)
```

---

## 4. Navigation par fonctionnalité

### 4.1 Bounded Context: Pilot Product

| Élément             | Path                                                                             | Responsabilité                      |
| ------------------- | -------------------------------------------------------------------------------- | ----------------------------------- |
| **Aggregate**       | `apps/server/src/domain/pilot/aggregate.ts`                                      | Définition PilotProduct             |
| **Value Objects**   | `apps/server/src/domain/pilot/value-objects/`                                    | IDs, SyncStatus, Dimensions         |
| **Events**          | `apps/server/src/domain/pilot/events.ts`                                         | PilotProductPublished, Synced       |
| **Enums**           | `apps/server/src/domain/pilot/enums.ts`                                          | ProductType, Category, Size, Status |
| **Command**         | `apps/server/src/application/pilot/commands/`                                    | CreatePilotProductCommand           |
| **Handler**         | `apps/server/src/application/pilot/handlers/`                                    | handlePilotProductCreation          |
| **Validation**      | `apps/server/src/application/pilot/validation/`                                  | Schemas de validation               |
| **Repository Port** | `apps/server/src/ports/driven/repositories/pilot-product.repository.ts`          | Interface                           |
| **Repository Impl** | `apps/server/src/infrastructure/persistence/mongodb/pilot-product.repository.ts` | MongoDB adapter (driven)            |
| **HTTP Handler**    | `apps/server/src/infrastructure/http/handlers/pilot-product.handler.ts`          | POST /api/pilot-product (driving)   |

**Dépendances inter-modules:**

- Dépend de: `shared` (CorrelationId, UserId)
- Consommé par: `catalog` (projection), `shopify` (sync)

### 4.2 Bounded Context: Catalog

| Élément             | Path                                                                      | Responsabilité              |
| ------------------- | ------------------------------------------------------------------------- | --------------------------- |
| **Projection**      | `apps/server/src/domain/catalog/projections/catalog-product.ts`           | Read model simplifié        |
| **Events**          | `apps/server/src/domain/catalog/events.ts`                                | CatalogProductProjected     |
| **Handler**         | `apps/server/src/application/catalog/handlers/`                           | catalogProjectionHandler    |
| **Projector**       | `apps/server/src/application/catalog/projectors/`                         | Transformation logic        |
| **Repository Port** | `apps/server/src/ports/driven/repositories/catalog-product.repository.ts` | Interface (driven)          |
| **Consumer**        | `apps/consumers/catalog-projection/src/main.ts`                           | RabbitMQ consumer (driving) |

**Dépendances:**

- Dépend de: `pilot` (PilotProductPublished event)

### 4.3 Bounded Context: Shopify Integration

| Élément         | Path                                                                    | Responsabilité              |
| --------------- | ----------------------------------------------------------------------- | --------------------------- |
| **Handler**     | `apps/server/src/application/shopify/handlers/shopify-sync.handler.ts`  | Sync logic                  |
| **Mapper**      | `apps/server/src/application/shopify/mappers/shopify-product.mapper.ts` | Domain → Shopify            |
| **DTO**         | `apps/server/src/application/shopify/dtos/shopify-product.dto.ts`       | Shopify API format          |
| **Client Port** | `apps/server/src/ports/driven/services/shopify-client.ts`               | Interface API (driven)      |
| **Consumer**    | `apps/consumers/shopify-sync/src/main.ts`                               | RabbitMQ consumer (driving) |

**Dépendances:**

- Dépend de: `pilot` (PilotProductPublished, SyncStatus update)

### 4.4 Packages partagés

| Package                         | Path                          | Contenu                                         |
| ------------------------------- | ----------------------------- | ----------------------------------------------- |
| **@maison-amane/api**           | `packages/api/src/`           | Routes HTTP, DTOs request/response, error codes |
| **@maison-amane/shared-kernel** | `packages/shared-kernel/src/` | CorrelationId, UserId, configs infra            |

---

## 5. Décisions architecturales

### ADR-1: Effect-TS comme framework core

**Contexte:** Besoin de gestion d'erreurs type-safe et d'injection de dépendances.

**Décision:** Utiliser Effect-TS pour toutes les opérations.

**Conséquences:**

- ✅ Erreurs explicites dans les signatures de type
- ✅ Composition fonctionnelle des dépendances via Context/Layer
- ✅ Testabilité via mock layers
- ⚠️ Courbe d'apprentissage significative

### ADR-2: Architecture Hexagonale (Ports & Adapters)

**Contexte:** Isoler le domaine des détails techniques.

**Décision:** Ports définis comme Context.Tag, Adapters comme Layer.

**Structure:**

```
ports/driven/     → Interfaces (ce dont le domaine a besoin)
infrastructure/   → Implémentations (adapters)
composition/      → Wiring (layers)
```

**Note sur les Driving Ports:**

Dans cette implémentation, nous n'utilisons **pas de driving ports explicites** (interfaces pour HTTP/messaging). Les adapters d'entrée (HTTP handlers, message consumers) appellent directement les command/query handlers de la couche application.

**Rationale:**

- Les HTTP handlers (@effect/platform) et message consumers (RabbitMQ) sont suffisamment découplés par la couche application
- Les command handlers sont déjà des points d'entrée bien définis
- Évite la sur-ingénierie d'interfaces intermédiaires qui ne seraient pas testées indépendamment
- Approche pragmatique courante dans les architectures Effect-TS

### ADR-3: CQRS avec séparation Write/Read Models

**Contexte:** Besoins UI différents des besoins métier.

**Décision:**

- Write Model: `PilotProduct` (complexe, invariants)
- Read Model: `CatalogProduct` (simplifié, optimisé UI)

**Communication:** Events asynchrones via RabbitMQ.

### ADR-4: Schema-First Validation (3 niveaux)

```
API Request (JSON brut)
    ↓ [1. API Schema]
Command DTO (types string)
    ↓ [2. Application Schema]
Validated Data (branded types)
    ↓ [3. Domain Schema]
Aggregate (invariants complets)
```

### ADR-5: State Machine pour SyncStatus

**Contexte:** États de synchronisation avec transitions contrôlées.

**Décision:** Machine d'état custom (pas XState) via union discriminée.

**États:** `NotSynced → Synced | SyncFailed`

### ADR-6: Pas de Driving Ports explicites

**Contexte:** Dans l'hexagonale pure, on pourrait créer des interfaces pour les adapters d'entrée.

**Décision:** Ne pas créer de ports explicites pour HTTP et messaging.

**Emplacement des adapters:**

```
DRIVING (appellent l'application):
├── apps/server/src/infrastructure/http/handlers/  → HTTP API
└── apps/consumers/*/src/main.ts                   → RabbitMQ consumers

DRIVEN (appelés par l'application):
├── apps/server/src/ports/driven/                  → Interfaces (Context.Tag)
└── apps/server/src/infrastructure/                → Implémentations (Layer)
    ├── persistence/mongodb/                       → Repositories
    ├── messaging/rabbitmq/                        → Event Publisher
    └── services/                                  → Clock, IdGenerator, etc.
```

**Conséquences:**

- ✅ Code plus simple, moins de couches intermédiaires
- ✅ Command handlers sont déjà des contrats d'entrée clairs
- ✅ Cohérent avec les patterns Effect-TS courants
- ⚠️ Dépendance directe sur @effect/platform (acceptable)

### Anti-patterns à éviter

| ❌ Ne pas faire                             | ✅ Faire plutôt                      |
| ------------------------------------------- | ------------------------------------ |
| Logique métier dans handlers HTTP           | Logique dans domain services         |
| Accès direct MongoDB dans application layer | Passer par les ports                 |
| Mutation d'objets domaine                   | Utiliser Data.case (immuable)        |
| Erreurs string                              | Erreurs typées avec Data.TaggedError |
| Validation manuelle                         | Effect Schema                        |
| Dépendances directes                        | Context.Tag + Layer                  |

---

## 6. Workflows de développement

### 6.1 Ajouter une nouvelle feature (nouveau use case)

**Ordre recommandé:** Domain → Application → Infrastructure → Composition

```bash
# 1. DOMAIN: Définir/étendre le modèle
apps/server/src/domain/{context}/
├── value-objects/new-vo.ts      # Si nouveau VO nécessaire
├── events.ts                     # Ajouter l'event si nécessaire
└── aggregate.ts                  # Ajouter méthode/champ si nécessaire

# 2. APPLICATION: Créer le use case
apps/server/src/application/{context}/
├── commands/new-command.command.ts
├── handlers/new-command.handler.ts
└── validation/new-schema.schema.ts  # Si validation spécifique

# 3. PORTS: Ajouter interface si nouveau service requis
apps/server/src/ports/driven/
├── repositories/                 # Si nouveau repo
└── services/                     # Si nouveau service externe

# 4. INFRASTRUCTURE: Implémenter
apps/server/src/infrastructure/
├── http/handlers/               # Endpoint HTTP
├── persistence/mongodb/         # Repo si nouveau
└── services/                    # Service si nouveau

# 5. COMPOSITION: Wirer
apps/server/src/composition/layers/
└── {env}.layer.ts               # Ajouter au layer approprié

# 6. TESTS
apps/server/src/application/{context}/handlers/new-command.handler.test.ts
```

### 6.2 Modifier un bounded context existant

```bash
# 1. Comprendre l'existant
Read: apps/server/src/domain/{context}/aggregate.ts
Read: apps/server/src/domain/{context}/events.ts

# 2. Modifier le domaine en premier
# 3. Propager les changements vers application
# 4. Adapter l'infrastructure si nécessaire
# 5. Mettre à jour les tests
```

### 6.3 Ajouter un nouveau consumer

```bash
# 1. Créer le consumer
apps/consumers/{name}/
├── src/
│   └── main.ts
├── package.json
└── tsconfig.json

# 2. Pattern main.ts
import { Effect } from 'effect'
import { startConsumer } from '@maison-amane/server'

const handler = (event: DomainEvent) =>
  Effect.gen(function* () {
    // Logique de traitement
  })

const program = startConsumer("consumer-name", handler)
Effect.runPromise(program)
```

### 6.4 Commandes utiles

```bash
# Développement
pnpm dev                    # Watch mode all apps
pnpm build                  # Build all
pnpm test                   # Run tests
pnpm typecheck              # Vérification types
pnpm lint                   # ESLint
pnpm format                 # Prettier

# Commit (Conventional Commits)
pnpm commit                 # Commitizen wizard
```

---

## 7. Référence rapide

### Imports courants

```typescript
// Effect core
import { Effect, Layer, Context, Data, Option } from 'effect'
import * as S from 'effect/Schema'

// Domain
import { PilotProduct, MakePilotProduct } from '../domain/pilot'
import { ProductId, SyncStatus } from '../domain/pilot/value-objects'

// Ports
import { PilotProductRepository, IdGenerator, Clock, EventPublisher } from '../ports/driven'

// Infrastructure
import { MongodbPilotProductRepositoryLive } from '../infrastructure/persistence/mongodb'
```

### Structure d'un handler Effect

```typescript
export const handleSomething = (
  command: SomeCommand
): Effect.Effect<ReturnType, ErrorType, Dependency1 | Dependency2> =>
  Effect.gen(function* () {
    const dep1 = yield* Dependency1
    const result = yield* dep1.operation()
    return result
  })
```

### Structure d'un repository

```typescript
// Port
export interface SomeRepositoryService {
  readonly save: (entity: E) => Effect.Effect<E, PersistenceError>
  readonly findById: (id: Id) => Effect.Effect<Option.Option<E>, PersistenceError>
}

export class SomeRepository extends Context.Tag('SomeRepository')<
  SomeRepository,
  SomeRepositoryService
>() {}

// Adapter
export const SomeRepositoryLive = Layer.effect(
  SomeRepository,
  Effect.map(MongoDatabase, (db) => createRepository(db))
)
```

### Topology RabbitMQ

```
Exchange: pilot_events (topic, durable)
├── Routing: pilot.product.published
│   ├── Queue: catalog-projection → CatalogProduct update
│   └── Queue: shopify-sync → Shopify API call
└── Routing: pilot.product.synced
    └── (future consumers)
```

### Collections MongoDB

| Collection         | Bounded Context | Type        |
| ------------------ | --------------- | ----------- |
| `pilot_products`   | Pilot           | Write Model |
| `catalog_products` | Catalog         | Read Model  |

### Variables d'environnement

```bash
# MongoDB
MONGO_URI=mongodb://admin:password@localhost:27017
MONGO_DB=maison_amane

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Server
PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# Shopify (future)
SHOPIFY_STORE_URL=
SHOPIFY_ACCESS_TOKEN=
```

---

> **Mise à jour:** Ce fichier doit être mis à jour lors de changements architecturaux majeurs.
