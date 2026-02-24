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

- 5 applications (`apps/`)
- 2 packages partagés (`packages/`)

### Stack technique

| Catégorie       | Technologie        | Version     |
| --------------- | ------------------ | ----------- |
| Runtime         | Node.js            | >= 18       |
| Package Manager | pnpm               | 9.0.0       |
| Build           | Turbo              | 2.4.2       |
| Core Framework  | Effect-TS          | 3.13.1      |
| HTTP (server)   | @effect/platform   | -           |
| HTTP (client)   | Next.js            | 16.1.0      |
| UI              | React + MUI        | 19.0 / 7.3  |
| Base de données | MongoDB            | 6.12.0      |
| Message Broker  | RabbitMQ (amqplib) | 0.10.9      |
| Image Upload    | Cloudinary         | unsigned    |
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
| **Media**   | Write Model | Enregistrement et confirmation des images uploadées                   |
| **Catalog** | Read Model  | Projection simplifiée pour l'UI du catalogue                          |
| **Shopify** | Integration | Synchronisation externe vers Shopify                                  |

---

## 2. Structure du projet

### Arborescence racine

```
maison-amane/
├── apps/
│   ├── server/              # API principale (Effect HTTP)
│   ├── client/              # Back-office Next.js 16 (MUI 7, Effect-TS)
│   ├── consumers/           # Message consumers (Driving adapters)
│   │   ├── catalog-projection/  # Consumer: projection read model
│   │   ├── media-confirmation/  # Consumer: media status confirmation
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
│   │   ├── commands/                # DTOs de commande (creation, update)
│   │   ├── queries/                 # DTOs de query (Data.case direct)
│   │   ├── handlers/                # Command + Query handlers (CQRS)
│   │   ├── mappers/                 # Validated → Domain mappers
│   │   └── validation/              # Schemas de validation
│   ├── shared/
│   │   └── event-helpers.ts         # publishEvent avec retry
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
│   │   ├── mappers/                 # Error/Response mappers (RFC 7807)
│   │   └── helpers/                 # Observability, command context
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

### Structure apps/client/src (application front-office)

```
src/
├── app/                              # ══════ PAGES (App Router) ══════
│   ├── layout.tsx                    # Root layout (Sidebar + ThemeRegistry)
│   ├── page.tsx                      # Home page (/)
│   ├── not-found.tsx                 # 404 page
│   └── products/
│       ├── page.tsx                  # Product list (/products)
│       ├── actions.ts               # Server Actions (create, update, registerMedia)
│       ├── loading.tsx              # Loading skeleton
│       └── (detail)/                # Route group
│           ├── new/page.tsx         # Create (/products/new)
│           └── [id]/
│               ├── page.tsx         # Edit (/products/[id])
│               └── error.tsx        # Error boundary
├── components/                       # ══════ COMPOSANTS UI ══════
│   ├── layout/
│   │   ├── Sidebar.tsx              # Navigation latérale
│   │   └── ActionPanel.tsx          # Panneau droit (titre + save)
│   └── product/
│       ├── ProductListGrid.tsx      # Grille de cards produits
│       ├── ProductDetailShell.tsx   # Layout + context provider
│       └── ProductEditorContent.tsx # Zone upload + galerie images
├── contexts/
│   └── ProductFormContext.tsx        # State management formulaire (mode, titre, images)
├── hooks/
│   └── useImageUpload.ts            # Upload Cloudinary + enregistrement média (Effect-TS)
├── lib/
│   ├── api-client.ts                # HttpApiClient Effect (runApi, runApiPage)
│   ├── config.ts                    # Config publique (Cloudinary)
│   ├── config.server.ts             # Config serveur (API_URL)
│   └── throw-api-error.ts          # Error handler API
└── theme/
    ├── ThemeRegistry.tsx            # MUI ThemeProvider + SnackbarProvider
    └── theme.ts                     # Palette personnalisée (tons terre)
```

**Patterns client :**

| Pattern           | Description                             | Exemple                                       |
| ----------------- | --------------------------------------- | --------------------------------------------- |
| Server Component  | Page async, data loading SSR            | `products/page.tsx`                           |
| Server Action     | Fonction `'use server'` pour mutations  | `actions.ts` (createProduct, updateProduct)   |
| Shell / Content   | Shell = layout + provider, Content = UI | `ProductDetailShell` / `ProductEditorContent` |
| Context + Hook    | State partagé via React Context         | `ProductFormContext` + `useImageUpload`       |
| Effect dans React | `gen()` + `runPromise()` dans callbacks | `useImageUpload.ts`                           |
| API Client        | `HttpApiClient.make()` type-safe        | `api-client.ts` (runApi, runApiPage)          |

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
import { type Effect, fail, succeed } from 'effect/Effect'
import * as S from 'effect/Schema'

// Schema définit la structure et les contraintes
export const PilotProductSchema = S.TaggedStruct('PilotProduct', {
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

// Constructeur immuable via Data.case (camelCase)
export const makePilotProduct = (params: Omit<PilotProduct, '_tag'>): PilotProduct =>
  Data.case<PilotProduct>()({ _tag: 'PilotProduct', ...params })

// ============================================
// AGGREGATE METHODS (fonctions pures)
// ============================================

// Mise à jour partielle de champs — retourne un nouveau PilotProduct
export const withUpdatedFields = (
  product: PilotProduct,
  updates: Partial<
    Pick<
      PilotProduct,
      'label' | 'type' | 'category' | 'description' | 'priceRange' | 'variants' | 'views'
    >
  >,
  updatedAt: Date
): PilotProduct => makePilotProduct({ ...product, ...updates, updatedAt })

// Transition d'état : DRAFT → PUBLISHED (Effect car peut échouer)
export const publish = (
  product: PilotProduct,
  updatedAt: Date
): Effect<PilotProduct, PublicationNotAllowed> => {
  if (product.status === ProductStatus.ARCHIVED) {
    return fail(new PublicationNotAllowed({ reason: 'Cannot publish an archived product' }))
  }
  if (product.status === ProductStatus.PUBLISHED) {
    return fail(new PublicationNotAllowed({ reason: 'Product is already published' }))
  }
  return succeed(makePilotProduct({ ...product, status: ProductStatus.PUBLISHED, updatedAt }))
}

// Transition d'état : DRAFT|PUBLISHED → ARCHIVED (Effect car peut échouer)
export const archive = (
  product: PilotProduct,
  updatedAt: Date
): Effect<PilotProduct, ArchiveNotAllowed> => {
  if (product.status === ProductStatus.ARCHIVED) {
    return fail(new ArchiveNotAllowed({ reason: 'Product is already archived' }))
  }
  return succeed(makePilotProduct({ ...product, status: ProductStatus.ARCHIVED, updatedAt }))
}

// ============================================
// POLICIES (aggregate knowledge)
// ============================================

export const requiresChangeNotification = (product: PilotProduct): boolean =>
  product.status === ProductStatus.PUBLISHED || product.status === ProductStatus.ARCHIVED
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

// Constructeurs (camelCase)
export const makeNotSynced = (): NotSynced => Data.case<NotSynced>()({ _tag: 'NotSynced' })

export const makeSynced = (params: Omit<Synced, '_tag'>): Synced =>
  Data.case<Synced>()({ _tag: 'Synced', ...params })

export const makeSyncFailed = (params: Omit<SyncFailed, '_tag'>): SyncFailed =>
  Data.case<SyncFailed>()({ _tag: 'SyncFailed', ...params })
```

### 3.3 Branded Types (IDs)

```typescript
// apps/server/src/domain/pilot/value-objects/ids.ts

import * as S from 'effect/Schema'

// ProductId est défini dans shared-kernel et ré-exporté
export { ProductIdSchema, makeProductId, type ProductId } from '@maison-amane/shared-kernel'

// Brand garantit l'unicité du type au compile-time
export const ShopifyProductIdSchema = S.String.pipe(S.brand('ShopifyProductId'))
export type ShopifyProductId = typeof ShopifyProductIdSchema.Type
export const makeShopifyProductId = S.decodeUnknownSync(ShopifyProductIdSchema)
```

### 3.4 Port (Interface Repository)

```typescript
// apps/server/src/ports/driven/repositories/pilot-product.repository.ts

import { Context } from 'effect'
import type { Effect } from 'effect/Effect'
import type { Option } from 'effect/Option'

// Interface du service — avec distinction findById (Option) vs getById (fail)
export interface PilotProductRepositoryService {
  readonly save: (product: PilotProduct) => Effect<PilotProduct, PersistenceError>
  readonly update: (product: PilotProduct) => Effect<PilotProduct, PersistenceError>
  readonly findById: (id: ProductId) => Effect<Option<PilotProduct>, PersistenceError>
  readonly getById: (id: ProductId) => Effect<PilotProduct, PersistenceError | ProductNotFoundError>
}

// Context.Tag pour l'injection de dépendance
export class PilotProductRepository extends Context.Tag('PilotProductRepository')<
  PilotProductRepository,
  PilotProductRepositoryService
>() {}
```

**Pattern `findById` vs `getById`:**

| Méthode    | Retour                                         | Usage                                 |
| ---------- | ---------------------------------------------- | ------------------------------------- |
| `findById` | `Effect<Option<Entity>, PersistenceError>`     | Quand l'absence est un cas normal     |
| `getById`  | `Effect<Entity, PersistenceError \| NotFound>` | Quand l'entité DOIT exister (updates) |

**Erreur PersistenceError simplifiée:**

```typescript
// apps/server/src/ports/driven/repositories/errors.ts

import { Data } from 'effect'

export class PersistenceError extends Data.TaggedError('PersistenceError')<{
  readonly cause: unknown
}> {}
```

### 3.5 Adapter (Implémentation Repository)

```typescript
// apps/server/src/infrastructure/persistence/mongodb/pilot-product.repository.ts

import type { Collection, Db } from 'mongodb'

import { ProductNotFoundError } from '../../../domain/pilot'
import { PilotProductRepository as PilotProductRepositoryTag } from '../../../ports/driven'
import {
  findDocumentById,
  getDocumentById,
  insertDocument,
  replaceDocument,
} from './base-repository'
import { createRepositoryLayer } from './repository-layer-factory'

const COLLECTION_NAME = 'pilot_products'

export const createMongodbPilotProductRepository = (db: Db): PilotProductRepositoryService => {
  const collection: Collection<PilotProductDocument> = db.collection(COLLECTION_NAME)

  return {
    save: (product) => insertDocument(collection, toDocument(product), product),

    findById: (id) => findDocumentById(collection, id, fromDocument),

    // getById utilise le helper getDocumentById avec factory currifié pour l'erreur NotFound
    getById: (id) =>
      getDocumentById(
        collection,
        id,
        fromDocument,
        (productId) => new ProductNotFoundError({ productId })
      ),

    update: (product) => replaceDocument(collection, product.id, toDocument(product), product),
  }
}

// Layer via factory générique (élimine le boilerplate)
export const MongodbPilotProductRepositoryLive = createRepositoryLayer(
  PilotProductRepositoryTag,
  createMongodbPilotProductRepository
)
```

**Base Repository Helpers** (`base-repository.ts`):

```typescript
// apps/server/src/infrastructure/persistence/mongodb/base-repository.ts

// Wrap MongoDB Promise en Effect avec PersistenceError automatique
export const tryMongoOperation = <A>(operation: () => Promise<A>): Effect<A, PersistenceError> =>
  tryPromise({ try: operation, catch: (error) => new PersistenceError({ cause: error }) })

// CRUD generics: insertDocument, replaceDocument, findDocumentById, getDocumentById
// getDocumentById = findDocumentById + Option.match → fail(notFoundError(id))
export const getDocumentById = <TDocument, TEntity, TError>(
  collection: Collection<TDocument>,
  id: string,
  fromDocument: (doc: TDocument) => TEntity,
  notFoundError: (id: string) => TError  // Factory currifié
): Effect<TEntity, PersistenceError | TError> => /* ... */
```

**Repository Layer Factory** (`repository-layer-factory.ts`):

```typescript
// apps/server/src/infrastructure/persistence/mongodb/repository-layer-factory.ts

import { Context, Layer } from 'effect'
import { map } from 'effect/Effect'

export const createRepositoryLayer = <TService, TTag extends Context.Tag<...>>(
  tag: TTag,
  createRepository: (db: Db) => TService
): Layer.Layer<Tag.Identifier<TTag>, never, MongoDatabase> =>
  Layer.effect(tag, map(MongoDatabase, createRepository))
```

### 3.6 Command Handler (CQRS)

```typescript
// apps/server/src/application/pilot/handlers/create-pilot-product.handler.ts

// Imports sélectifs Effect (PAS import { Effect } from 'effect')
import { type Effect, gen } from 'effect/Effect'

import {
  makeNotSynced,
  makePilotProduct,
  makePilotProductPublished,
  type PilotProductCreationError,
  requiresChangeNotification,
} from '../../../domain/pilot'
import { Clock, EventPublisher, IdGenerator, PilotProductRepository } from '../../../ports/driven'
import { publishEvent } from '../../shared/event-helpers'

// Naming: pilotProductCreationHandler (PAS handlePilotProductCreation)
export const pilotProductCreationHandler = (
  command: PilotProductCreationCommand
): Effect<
  PilotProduct,
  PilotProductCreationError,
  PilotProductRepository | IdGenerator | EventPublisher | Clock
> =>
  gen(function* () {
    // 1. Validation
    const validated = yield* validateProductData(command.data)

    // 2. Création de l'agrégat
    const product = yield* createAggregate(validated)

    // 3. Persistance
    const repo = yield* PilotProductRepository
    const savedProduct = yield* repo.save(product)

    // 4. Émission d'événement (policy: requiresChangeNotification)
    if (requiresChangeNotification(savedProduct)) {
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

// CRITIQUE: chaque event DOIT avoir _version: S.Literal(1)
const PilotProductPublishedSchema = S.TaggedStruct('PilotProductPublished', {
  _version: S.Literal(1),
  productId: ProductIdSchema,
  product: PilotProductSchema,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductPublished = typeof PilotProductPublishedSchema.Type

// Constructeur camelCase — omit '_tag' ET '_version'
export const makePilotProductPublished = (
  params: Omit<PilotProductPublished, '_tag' | '_version'>
): PilotProductPublished =>
  Data.case<PilotProductPublished>()({ _tag: 'PilotProductPublished', _version: 1, ...params })

// Deuxième event: PilotProductUpdated (même pattern)
const PilotProductUpdatedSchema = S.TaggedStruct('PilotProductUpdated', {
  _version: S.Literal(1),
  productId: ProductIdSchema,
  product: PilotProductSchema,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductUpdated = typeof PilotProductUpdatedSchema.Type

export const makePilotProductUpdated = (
  params: Omit<PilotProductUpdated, '_tag' | '_version'>
): PilotProductUpdated =>
  Data.case<PilotProductUpdated>()({ _tag: 'PilotProductUpdated', _version: 1, ...params })

// Union de tous les events du bounded context
export type PilotDomainEvent = PilotProductPublished | PilotProductUpdated
```

### 3.8 Composition Layer (DI)

```typescript
// apps/server/src/composition/layers/development.layer.ts

import { Layer } from 'effect'

// Les repository layers sont créés via createRepositoryLayer (voir 3.5)
// MongodbPilotProductRepositoryLive requiert MongoDatabase en dépendance
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

### 3.10 Query DTO (CQRS Read)

```typescript
// apps/server/src/application/pilot/queries/get-pilot-product.query.ts

import { Data } from 'effect'
import type { ProductId } from '../../../domain/pilot'

// Query DTO: Data.case direct (pas de Schema, pas de validation)
const GetPilotProductQuery = Data.case<{
  readonly _tag: 'GetPilotProductQuery'
  readonly productId: ProductId
}>()

export type GetPilotProductQuery = ReturnType<typeof GetPilotProductQuery>

export const makeGetPilotProductQuery = (productId: ProductId): GetPilotProductQuery =>
  GetPilotProductQuery({ _tag: 'GetPilotProductQuery', productId })
```

### 3.11 Query Handler

```typescript
// apps/server/src/application/pilot/handlers/get-pilot-product.handler.ts

import { type Effect, gen } from 'effect/Effect'

import type { PilotProduct, PilotProductQueryError } from '../../../domain/pilot'
import { PilotProductRepository } from '../../../ports/driven'
import type { GetPilotProductQuery } from '../queries'

export const getPilotProductHandler = (
  query: GetPilotProductQuery
): Effect<PilotProduct, PilotProductQueryError, PilotProductRepository> =>
  gen(function* () {
    const repo = yield* PilotProductRepository
    return yield* repo.getById(query.productId)
  })
```

### 3.12 Update Handler (Option partials + aggregate methods)

```typescript
// apps/server/src/application/pilot/handlers/update-pilot-product.handler.ts

import { Option } from 'effect'
import { type Effect, gen } from 'effect/Effect'

import {
  archive,
  makePilotProductUpdated,
  ProductStatus,
  publish,
  requiresChangeNotification,
  withUpdatedFields,
  type PilotProduct,
  type PilotProductUpdateError,
} from '../../../domain/pilot'
import { Clock, EventPublisher, PilotProductRepository } from '../../../ports/driven'
import { publishEvent } from '../../shared/event-helpers'

export const pilotProductUpdateHandler = (
  command: PilotProductUpdateCommand
): Effect<PilotProduct, PilotProductUpdateError, PilotProductRepository | EventPublisher | Clock> =>
  gen(function* () {
    const validated = yield* validateUpdateData(command.data)

    const repo = yield* PilotProductRepository
    const existingProduct = yield* repo.getById(command.productId) // fail si absent

    const updatedProduct = yield* applyUpdates(existingProduct, validated)
    const savedProduct = yield* repo.update(updatedProduct)

    if (requiresChangeNotification(savedProduct)) {
      yield* emitEvent(savedProduct, command)
    }

    return savedProduct
  })

// Option partials: champs optionnels wrappés dans Option
// Option.getOrElse pour conserver la valeur existante si non fournie
const applyUpdates = (product: PilotProduct, validated: ValidatedUpdateData) =>
  gen(function* () {
    const clock = yield* Clock
    const now = yield* clock.now()

    const updated = withUpdatedFields(
      product,
      {
        label: Option.getOrElse(validated.label, () => product.label),
        type: Option.getOrElse(validated.type, () => product.type),
        // ... autres champs optionnels
      },
      now
    )

    // Transition d'état via aggregate methods (publish, archive)
    if (Option.isSome(validated.status)) {
      if (validated.status.value === ProductStatus.PUBLISHED) return yield* publish(updated, now)
      if (validated.status.value === ProductStatus.ARCHIVED) return yield* archive(updated, now)
    }

    return updated
  })
```

### 3.13 Event Helpers (publishEvent + retry)

```typescript
// apps/server/src/application/shared/event-helpers.ts

import { Schedule } from 'effect'
import { type Effect, gen, retry, catchAll, logError, annotateLogs } from 'effect/Effect'

import type { DomainEvent } from '../../domain'
import { EventPublisher } from '../../ports/driven'

// Retry strategy: 500ms → 1s → 2s (3 attempts, ~3.5s max latency)
// Si tous les retries échouent: log CRITICAL pour intervention manuelle
export const publishEvent = (event: DomainEvent): Effect<void, never, EventPublisher> =>
  gen(function* () {
    const publisher = yield* EventPublisher

    yield* publisher.publish(event).pipe(
      retry(Schedule.exponential('500 millis').pipe(Schedule.intersect(Schedule.recurs(3)))),
      catchAll((error) =>
        logError('EVENT_PUBLISH_FAILED_CRITICAL').pipe(
          annotateLogs({
            error: String(error.cause),
            eventType: event._tag,
            productId: event.productId,
            correlationId: event.correlationId,
            action: 'MANUAL_REPLAY_REQUIRED',
          })
        )
      )
    )
  })
```

### 3.14 RFC 7807 Problem Detail (Error Mapping)

```typescript
// apps/server/src/infrastructure/http/mappers/problem-detail.mapper.ts

// Chaque type d'erreur domaine est mappé vers un format RFC 7807

export interface ErrorContext {
  readonly correlationId: string
  readonly instance: string // e.g., "/api/v1/pilot-products"
}

// Mapper unifié pour création (ValidationError | PersistenceError)
export const toProblemDetail = (
  error: PilotProductCreationError,
  ctx: ErrorContext
): ApiValidationError | ApiPersistenceError | ApiInternalError => {
  if (isValidationError(error)) return toValidationProblemDetail(error, ctx)
  if (isPersistenceError(error)) return toPersistenceProblemDetail(error, ctx)
  return toInternalProblemDetail(ctx)
}

// Mapper pour update (ajoute NotFound)
export const toUpdateProblemDetail = (error: PilotProductUpdateError, ctx: ErrorContext) => {
  /* ValidationError | NotFound | PersistenceError | InternalError */
}

// Mapper pour query (NotFound | PersistenceError)
export const toQueryProblemDetail = (error: PilotProductQueryError, ctx: ErrorContext) => {
  /* NotFound | PersistenceError | InternalError */
}
```

### 3.15 Observability (HTTP Helpers)

```typescript
// apps/server/src/infrastructure/http/helpers/command-context.ts

// Génère le contexte standard pour chaque requête HTTP
export const generateCommandContext = (
  instance: string
): Effect<GeneratedContext, never, IdGenerator> =>
  gen(function* () {
    const idGen = yield* IdGenerator
    const correlationId = yield* idGen.generateCorrelationId()
    const userId = 'system' // TODO: Extract from auth context
    return {
      correlationId,
      userId,
      ctx: { correlationId, userId, startTime: new Date() },
      errorCtx: { correlationId, instance },
    }
  })

// apps/server/src/infrastructure/http/helpers/observability-wrapper.ts

// Wrap handler avec tracing, timing et error mapping RFC 7807
export const executeWithObservability = <A, E, EM, R>(
  ctx: CommandContext,
  operationName: string,
  httpOperation: string,
  handler: Effect<A, E, R>,
  errorMapper: (error: E) => EM
): Effect<A, EM, R> =>
  withObservability(ctx, operationName, httpOperation, handler).pipe(mapError(errorMapper))
```

### 3.16 Test Layer

```typescript
// apps/server/src/test-utils/test-layer.ts

import { Layer } from 'effect'

// Compose tous les stubs de test en un seul layer
export interface TestContext {
  layer: Layer.Layer<TestLayerServices, never, never>
  eventSpy: SpyEventPublisher
}

export const provideTestLayer = (): TestContext => {
  const { layer: eventPublisherLayer, spy: eventSpy } = SpyEventPublisherLive()

  const layer = Layer.mergeAll(
    InMemoryPilotProductRepositoryLive, // Real in-memory repo (not mocked)
    StubIdGeneratorLive(), // Deterministic ID generator
    StubClockLive(), // Fixed clock (TEST_DATE)
    eventPublisherLayer // Spy event publisher
  )

  return { layer, eventSpy }
}
```

---

## 4. Navigation par fonctionnalité

### 4.1 Bounded Context: Pilot Product

| Élément              | Path                                                                             | Responsabilité                                   |
| -------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Aggregate**        | `apps/server/src/domain/pilot/aggregate.ts`                                      | PilotProduct, aggregate methods, policies        |
| **Value Objects**    | `apps/server/src/domain/pilot/value-objects/`                                    | IDs, SyncStatus, Dimensions                      |
| **Events**           | `apps/server/src/domain/pilot/events.ts`                                         | PilotProductPublished, PilotProductUpdated       |
| **Errors**           | `apps/server/src/domain/pilot/errors.ts`                                         | ValidationError, ProductNotFoundError, etc.      |
| **Enums**            | `apps/server/src/domain/pilot/enums.ts`                                          | ProductType, Category, Size, Status              |
| **Commands**         | `apps/server/src/application/pilot/commands/`                                    | Creation + Update commands                       |
| **Queries**          | `apps/server/src/application/pilot/queries/`                                     | GetPilotProductQuery                             |
| **Creation Handler** | `apps/server/src/application/pilot/handlers/create-pilot-product.handler.ts`     | pilotProductCreationHandler                      |
| **Update Handler**   | `apps/server/src/application/pilot/handlers/update-pilot-product.handler.ts`     | pilotProductUpdateHandler                        |
| **Query Handler**    | `apps/server/src/application/pilot/handlers/get-pilot-product.handler.ts`        | getPilotProductHandler                           |
| **Variant Mapper**   | `apps/server/src/application/pilot/mappers/variant.mapper.ts`                    | Validated → Domain variant mapping               |
| **Validation**       | `apps/server/src/application/pilot/validation/`                                  | Schemas de validation                            |
| **Event Helpers**    | `apps/server/src/application/shared/event-helpers.ts`                            | publishEvent avec retry                          |
| **Repository Port**  | `apps/server/src/ports/driven/repositories/pilot-product.repository.ts`          | Interface (findById, getById)                    |
| **Repository Impl**  | `apps/server/src/infrastructure/persistence/mongodb/pilot-product.repository.ts` | MongoDB adapter (driven)                         |
| **Base Repository**  | `apps/server/src/infrastructure/persistence/mongodb/base-repository.ts`          | Generic MongoDB helpers                          |
| **HTTP Handler**     | `apps/server/src/infrastructure/http/handlers/pilot-product.handler.ts`          | POST, PUT, GET /api/v1/pilot-products (driving)  |
| **Problem Detail**   | `apps/server/src/infrastructure/http/mappers/problem-detail.mapper.ts`           | RFC 7807 error mapping                           |
| **HTTP Helpers**     | `apps/server/src/infrastructure/http/helpers/`                                   | generateCommandContext, executeWithObservability |

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

### 4.4 Bounded Context: Media

| Élément              | Path                                                                     | Responsabilité                            |
| -------------------- | ------------------------------------------------------------------------ | ----------------------------------------- |
| **Aggregate**        | `apps/server/src/domain/media/aggregate.ts`                              | Media, confirmMedia method                |
| **Value Objects**    | `apps/server/src/domain/media/value-objects/`                            | MediaId, MediaUrl, MimeType, FileSize     |
| **Enums**            | `apps/server/src/domain/media/enums.ts`                                  | MediaStatus (PENDING, CONFIRMED)          |
| **Errors**           | `apps/server/src/domain/media/errors.ts`                                 | MediaNotFoundError, MediaAlreadyConfirmed |
| **Command**          | `apps/server/src/application/media/commands/register-media.command.ts`   | RegisterMediaCommand                      |
| **Register Handler** | `apps/server/src/application/media/handlers/register-media.handler.ts`   | registerMediaHandler                      |
| **Confirm Handler**  | `apps/server/src/application/media/handlers/confirm-media.handler.ts`    | confirmMediaHandler                       |
| **Repository Port**  | `apps/server/src/ports/driven/repositories/media.repository.ts`          | Interface (findById, getById)             |
| **Repository Impl**  | `apps/server/src/infrastructure/persistence/mongodb/media.repository.ts` | MongoDB adapter                           |
| **HTTP Handler**     | `apps/server/src/infrastructure/http/handlers/media.handler.ts`          | POST /api/media (driving)                 |
| **Consumer**         | `apps/consumers/media-confirmation/src/main.ts`                          | RabbitMQ consumer (driving)               |

**Dépendances :**

- Dépend de: `pilot` (routing keys product.created, product.updated pour confirmation)
- Consommé par: `pilot` (les produits référencent les mediaIds dans leurs views)

### 4.5 Packages partagés

| Package                         | Path                          | Contenu                                         |
| ------------------------------- | ----------------------------- | ----------------------------------------------- |
| **@maison-amane/api**           | `packages/api/src/`           | Routes HTTP, DTOs request/response, error codes |
| **@maison-amane/shared-kernel** | `packages/shared-kernel/src/` | CorrelationId, UserId, configs infra            |

### 4.6 Application Client (apps/client)

| Élément                  | Path                                                          | Responsabilité                                  |
| ------------------------ | ------------------------------------------------------------- | ----------------------------------------------- |
| **Product List**         | `apps/client/src/app/products/page.tsx`                       | Liste des produits (SSR, cards grid)            |
| **Product Create**       | `apps/client/src/app/products/(detail)/new/page.tsx`          | Création produit (formulaire)                   |
| **Product Edit**         | `apps/client/src/app/products/(detail)/[id]/page.tsx`         | Édition produit (chargement SSR + update)       |
| **Server Actions**       | `apps/client/src/app/products/actions.ts`                     | createProduct, updateProduct, registerMedia     |
| **API Client**           | `apps/client/src/lib/api-client.ts`                           | HttpApiClient Effect (runApi, runApiPage)       |
| **ProductFormContext**   | `apps/client/src/contexts/ProductFormContext.tsx`             | State formulaire (mode, titre, images, canSave) |
| **useImageUpload**       | `apps/client/src/hooks/useImageUpload.ts`                     | Upload Cloudinary + enregistrement Effect-TS    |
| **ProductListGrid**      | `apps/client/src/components/product/ProductListGrid.tsx`      | Composant grille de cards                       |
| **ProductDetailShell**   | `apps/client/src/components/product/ProductDetailShell.tsx`   | Layout shell + provider                         |
| **ProductEditorContent** | `apps/client/src/components/product/ProductEditorContent.tsx` | Upload zone + galerie                           |
| **Sidebar**              | `apps/client/src/components/layout/Sidebar.tsx`               | Navigation latérale collapsible                 |
| **ActionPanel**          | `apps/client/src/components/layout/ActionPanel.tsx`           | Panneau titre + save                            |

**Communication avec le serveur :**

- Pages SSR : `runApiPage()` → `HttpApiClient` → `GET /api/pilot-product[/:id]`
- Mutations : Server Actions → `runApi()` → `POST/PUT /api/pilot-product`, `POST /api/media`
- Images : Client → Cloudinary (XHR direct) → Server Action `registerMedia` → `POST /api/media`

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

### ADR-7: Communication inter-Bounded Contexts

**Contexte:** Les bounded contexts communiquent via RabbitMQ. Il faut définir les patterns de communication supportés et quand les utiliser.

**Décision:** Trois patterns supportés, par ordre de complexité croissante :

**Pattern 1 — Choreography (fire-and-forget)**

- Le BC source publie un event, le BC cible réagit de manière autonome
- Le BC source ne sait pas et ne se soucie pas du résultat
- Cas d'usage : Pilot → Catalog (projection read model)

**Pattern 2 — Choreography avec suivi (request-response via events)**

- Le BC source publie un event et maintient un état de suivi (ex: SyncStatus)
- Le BC cible réagit, puis publie un event de résultat (success/failure)
- Le BC source réagit au résultat et met à jour son état
- Cas d'usage : Pilot ↔ Shopify (sync + retour de statut)

**Pattern 3 — Saga / Process Manager**

- Un composant coordinateur orchestre un workflow multi-BC
- Gère les compensations en cas d'échec (rollback distribué)
- Cas d'usage futur : Custom Product → Production → Livraison (si compensation nécessaire)

**Critère de choix :**

- Pas besoin de résultat → Pattern 1
- Besoin de connaître le résultat mais pas de compensation → Pattern 2
- Besoin de compensation transactionnelle cross-BC → Pattern 3

**Mapping actuel :**

| Interaction                         | Pattern             | Implémentation                                            |
| ----------------------------------- | ------------------- | --------------------------------------------------------- |
| Pilot → Catalog                     | 1 (fire-and-forget) | Event PilotProductPublished → consumer catalog-projection |
| Pilot ↔ Shopify                     | 2 (avec suivi)      | Event → consumer shopify-sync → SyncStatus update         |
| Pilot → AI Content (futur)          | 1 (fire-and-forget) | Event → consumer enrichissement                           |
| Custom Product → Production (futur) | 2 ou 3 (à décider)  | Dépend du besoin de compensation                          |

**Conséquences :**

- ✅ Pattern par défaut = choreography (simple, découplé)
- ✅ Le pattern 2 est déjà implémenté avec SyncStatus
- ⚠️ Le pattern 3 n'est pas encore nécessaire — à implémenter quand un workflow multi-BC requiert des compensations

### ADR-8: Stratégie d'évolution de schéma

**Contexte:** Les domain events et documents MongoDB évoluent avec le temps. Il faut une stratégie pour ne pas casser les consumers et les lectures existantes.

**Décision:**

**Events (RabbitMQ) — Upcasting au consumer :**

- Le publisher envoie TOUJOURS la dernière version de l'event
- Le `_version` field permet aux consumers de détecter la version
- Pour une évolution non-breaking (ajout de champ) : incrémenter `_version`, ajouter le champ optionnel
- Pour une évolution breaking : créer un nouvel event (ex: `PilotProductPublishedV2`) et déprécier l'ancien
- Le consumer gère les anciennes versions via un upcaster qui transforme vN → vN+1
- Règle : **jamais de suppression de champ** sur un event publié, toujours additif

**Documents MongoDB — Migration lazy :**

- Lire l'ancien format, écrire le nouveau (lazy migration)
- Le mapper `fromDocument` gère les deux formats avec un fallback
- Pour les migrations massives : script one-shot si nécessaire

**Règles :**

1. Un event publié ne doit JAMAIS avoir de breaking change (suppression/renommage de champ)
2. Les ajouts de champs sont optionnels (avec valeur par défaut)
3. Le `_version` est incrémenté à chaque modification de la structure de l'event
4. Les consumers doivent supporter la version courante ET la version N-1 minimum

**Conséquences :**

- ✅ Pas de downtime lors des déploiements
- ✅ Les consumers peuvent être déployés indépendamment
- ⚠️ Le code des consumers peut accumuler de la dette technique (upcasters à nettoyer périodiquement)

### ADR-9: Politique du Shared Kernel

**Contexte:** Le package `@maison-amane/shared-kernel` contient des types et services partagés entre bounded contexts. Il faut définir ce qui y va et ce qui n'y va pas pour éviter le couplage.

**Décision:**

**Ce qui va dans shared-kernel :**

- IDs cross-context (ProductId, CorrelationId, UserId) — branded types réutilisés par plusieurs BC
- Enums partagés (ProductCategory, Size, PriceRange) — référentiels communs
- Configuration infrastructure (MongoDB, RabbitMQ, Shopify) — configs techniques
- Messaging topology (EXCHANGES, ROUTING_KEYS, bootstrapConsumer) — contrats d'intégration
- Runtime bootstrap — helpers de démarrage

**Ce qui n'y va PAS :**

- Types métier spécifiques à un BC (PilotProduct, CatalogProduct, SyncStatus)
- Errors spécifiques à un BC (ProductNotFoundError, PublicationNotAllowed)
- Logique métier (aggregate methods, domain services)
- Schemas de validation applicatifs

**Règles :**

1. Un type dans shared-kernel ne doit JAMAIS dépendre d'un BC
2. L'ajout d'un type dans shared-kernel nécessite une justification : il est utilisé par 2+ BC
3. Les routing keys et exchanges sont dans shared-kernel car ils sont le contrat entre publisher et consumer
4. Préférer la duplication à un couplage inadéquat — si deux BC ont un concept similaire mais pas identique, dupliquer

**Conséquences :**

- ✅ Couplage minimal entre BC
- ✅ Shared-kernel reste stable et change rarement
- ⚠️ Certains types peuvent sembler dupliqués (intentionnel — chaque BC évolue indépendamment)

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

### Imports sélectifs Effect

```typescript
// CONVENTION: imports sélectifs depuis les sous-modules (PAS `import { Effect } from 'effect'`)
import { type Effect, gen, fail, succeed } from 'effect/Effect'
import { Data, Option } from 'effect'
import * as S from 'effect/Schema'

// Domain
import { makePilotProduct, type PilotProduct } from '../domain/pilot'
import { makeProductId, type ProductId } from '../domain/pilot/value-objects'

// Ports
import { PilotProductRepository, IdGenerator, Clock, EventPublisher } from '../ports/driven'
```

### Conventions de nommage

| Pattern              | Convention                                       | Exemple                             |
| -------------------- | ------------------------------------------------ | ----------------------------------- |
| Constructeur         | `make{Entity}` (camelCase)                       | `makePilotProduct`, `makeNotSynced` |
| Handler creation     | `{entity}CreationHandler`                        | `pilotProductCreationHandler`       |
| Handler update       | `{entity}UpdateHandler`                          | `pilotProductUpdateHandler`         |
| Handler query        | `get{Entity}Handler`                             | `getPilotProductHandler`            |
| Event constructor    | `make{EventName}`                                | `makePilotProductPublished`         |
| Command constructor  | `make{CommandName}`                              | `makePilotProductCreationCommand`   |
| Query constructor    | `make{QueryName}`                                | `makeGetPilotProductQuery`          |
| Aggregate method     | Fonction pure `(product, ...args) => Product`    | `withUpdatedFields`, `markSynced`   |
| Aggregate transition | Fonction Effect `(product, ...) => Effect<P, E>` | `publish`, `archive`                |
| Policy               | `requires{Something}` retourne boolean           | `requiresChangeNotification`        |

### Structure d'un command handler

```typescript
// Imports sélectifs
import { type Effect, gen } from 'effect/Effect'

// Naming: pilotProductCreationHandler (PAS handlePilotProductCreation)
export const pilotProductCreationHandler = (
  command: PilotProductCreationCommand
): Effect<PilotProduct, PilotProductCreationError, Dependencies> =>
  gen(function* () {
    const validated = yield* validateProductData(command.data)
    const product = yield* createAggregate(validated)
    const repo = yield* PilotProductRepository
    const savedProduct = yield* repo.save(product)
    if (requiresChangeNotification(savedProduct)) {
      yield* emitEvent(savedProduct, command)
    }
    return savedProduct
  })
```

### Structure d'un query handler

```typescript
export const getPilotProductHandler = (
  query: GetPilotProductQuery
): Effect<PilotProduct, PilotProductQueryError, PilotProductRepository> =>
  gen(function* () {
    const repo = yield* PilotProductRepository
    return yield* repo.getById(query.productId)
  })
```

### Structure d'un repository

```typescript
// Port — avec findById (Option) ET getById (fail si absent)
export interface SomeRepositoryService {
  readonly save: (entity: E) => Effect<E, PersistenceError>
  readonly findById: (id: Id) => Effect<Option<E>, PersistenceError>
  readonly getById: (id: Id) => Effect<E, PersistenceError | NotFoundError>
  readonly update: (entity: E) => Effect<E, PersistenceError>
}

export class SomeRepository extends Context.Tag('SomeRepository')<
  SomeRepository,
  SomeRepositoryService
>() {}

// Adapter — via createRepositoryLayer factory
export const SomeRepositoryLive = createRepositoryLayer(SomeRepository, createMongodbRepository)
```

### Structure d'un domain event

```typescript
// CRITIQUE: _version: S.Literal(1) obligatoire
const SomeEventSchema = S.TaggedStruct('SomeEvent', {
  _version: S.Literal(1),
  // ... autres champs
})

// Constructeur: omit '_tag' ET '_version'
export const makeSomeEvent = (params: Omit<SomeEvent, '_tag' | '_version'>): SomeEvent =>
  Data.case<SomeEvent>()({ _tag: 'SomeEvent', _version: 1, ...params })
```

### Topology RabbitMQ

```
Exchange: pilot_events (topic, durable)
├── Routing: pilot.product.published
│   ├── Queue: catalog-projection → CatalogProduct update
│   └── Queue: shopify-sync → Shopify API call
├── Routing: pilot.product.updated
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

# Client (apps/client)
API_URL=http://localhost:3001
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dhk8ipori
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=maison_amane_dev
```

---

> **Mise à jour:** Ce fichier doit être mis à jour lors de changements architecturaux majeurs.
