---
name: use-case-cqrs-effect
description: Crée des command handlers (write) et query handlers (read) avec Effect. Utiliser pour implémenter les use cases applicatifs CQRS.
---

# Application Use Case (CQRS Handler)

## Quand utiliser ce skill

- "Créer un handler pour [action] sur [entity]"
- "Implémenter le use case [créer/modifier/supprimer] [entity]"
- "Ajouter une query pour récupérer [données]"
- "Créer une commande pour [action métier]"

## Contexte nécessaire

1. **Type** : Command (write) ou Query (read)
2. **Données d'entrée** : structure de la commande/query
3. **Données de sortie** : aggregate, DTO, ou projection
4. **Dépendances** : repositories, services externes, clock, etc.
5. **Events** : events à émettre (pour commands)

## Workflow

### 1. Analyse

- Identifier les validations requises
- Lister les dépendances (ports) nécessaires
- Définir les erreurs possibles
- Déterminer si un event doit être émis

### 2. Génération

Structure pour un command handler :

```
application/{context}/
├── commands/
│   └── {action}-{entity}.command.ts    # DTO commande
├── handlers/
│   ├── {action}-{entity}.handler.ts    # Logique métier
│   └── {action}-{entity}.handler.test.ts
└── validation/
    └── {entity}-input.schema.ts        # Transformation schemas
```

### 3. Validation

- [ ] Signature de type complète (retour, erreurs, dépendances)
- [ ] Validation via Effect Schema
- [ ] Gestion explicite des erreurs
- [ ] Event émis si état modifié (pour PUBLISHED)
- [ ] Tests d'intégration avec test layer

## Patterns techniques

### Pattern 1 : Command DTO

```typescript
// application/{context}/commands/create-{entity}.command.ts
import { Data } from 'effect'
import type { CorrelationId, UserId } from '../../../domain/shared'

// Input non validé (from API)
export interface UnvalidatedProductData {
  readonly label: string
  readonly type: string
  readonly category: string
  readonly description: string
  readonly variants: readonly {
    size: string
    customDimensions?: { width: number; length: number }
    price?: number
  }[]
  readonly status: string
}

// Command avec metadata
export interface PilotProductCreationCommand {
  readonly _tag: 'PilotProductCreationCommand'
  readonly data: UnvalidatedProductData
  readonly correlationId: CorrelationId
  readonly userId: UserId
  readonly timestamp: Date
}

export const MakePilotProductCreationCommand = (
  params: Omit<PilotProductCreationCommand, '_tag'>
): PilotProductCreationCommand =>
  Data.case<PilotProductCreationCommand>()({
    _tag: 'PilotProductCreationCommand',
    ...params,
  })
```

### Pattern 2 : Validation Schema (transformation)

```typescript
// application/{context}/validation/{entity}-input.schema.ts
import { Effect } from 'effect'
import * as S from 'effect/Schema'

// Input brut (strings)
const UnvalidatedVariantSchema = S.Struct({
  size: S.String,
  customDimensions: S.optional(
    S.Struct({
      width: S.Number,
      length: S.Number,
    })
  ),
  price: S.optional(S.Number),
})

// Output validé (branded types, union discriminée)
const ValidatedStandardVariantSchema = S.Struct({
  _tag: S.Literal('StandardVariant'),
  size: SizeSchema, // enum
})

const ValidatedCustomVariantSchema = S.Struct({
  _tag: S.Literal('CustomVariant'),
  size: S.Literal(Size.CUSTOM),
  customDimensions: DimensionsSchema,
  price: PriceSchema,
})

// Transformation avec logique conditionnelle
export const ValidatedVariantSchema = S.transformOrFail(
  UnvalidatedVariantSchema,
  S.Union(ValidatedStandardVariantSchema, ValidatedCustomVariantSchema),
  {
    strict: true,
    decode: (input) => {
      if (input.size === 'CUSTOM') {
        if (!input.customDimensions || !input.price) {
          return Effect.fail(
            new S.ParseError([
              /* error */
            ])
          )
        }
        return S.decodeUnknown(ValidatedCustomVariantSchema)({
          _tag: 'CustomVariant',
          size: Size.CUSTOM,
          customDimensions: input.customDimensions,
          price: input.price,
        }).pipe(Effect.mapError((e) => e.issue))
      }
      return S.decodeUnknown(ValidatedStandardVariantSchema)({
        _tag: 'StandardVariant',
        size: input.size,
      }).pipe(Effect.mapError((e) => e.issue))
    },
    encode: (validated) =>
      Effect.succeed({
        /* reverse */
      }),
  }
)

// Fonction de validation utilisable dans le handler
export const validateProductData = (
  input: UnvalidatedProductData
): Effect.Effect<ValidatedProductData, ValidationError> =>
  S.decodeUnknown(ValidatedProductDataSchema)(input).pipe(
    Effect.mapError(
      (parseError) =>
        new ValidationError({
          field: 'productData',
          message: 'Invalid product data',
          details: parseError,
        })
    )
  )
```

### Pattern 3 : Command Handler complet

```typescript
// application/{context}/handlers/create-{entity}.handler.ts
import { Effect } from 'effect'

import {
  MakePilotProduct,
  MakeNotSynced,
  MakePilotProductPublished,
  type PilotProduct,
  type PilotProductCreationError,
  ProductStatus,
} from '../../../domain/pilot'
import { Clock, EventPublisher, IdGenerator, PilotProductRepository } from '../../../ports/driven'
import { validateProductData, type ValidatedProductData } from '../validation'
import type { PilotProductCreationCommand } from '../commands'

// ============================================
// HANDLER PRINCIPAL
// ============================================

export const handlePilotProductCreation = (
  command: PilotProductCreationCommand
): Effect.Effect<
  PilotProduct, // Retour en cas de succès
  PilotProductCreationError, // Union des erreurs possibles
  PilotProductRepository | IdGenerator | EventPublisher | Clock // Dépendances
> =>
  Effect.gen(function* () {
    // 1. VALIDATION
    const validated = yield* validateProductData(command.data)

    // 2. CRÉATION AGGREGATE
    const product = yield* createAggregate(validated)

    // 3. PERSISTANCE
    const repo = yield* PilotProductRepository
    const savedProduct = yield* repo.save(product)

    // 4. ÉMISSION EVENT (conditionnel)
    if (savedProduct.status === ProductStatus.PUBLISHED) {
      yield* emitEvent(savedProduct, command)
    }

    return savedProduct
  })

// ============================================
// HELPERS PRIVÉS
// ============================================

const createAggregate = (
  validated: ValidatedProductData
): Effect.Effect<PilotProduct, never, IdGenerator | Clock> =>
  Effect.gen(function* () {
    const idGen = yield* IdGenerator
    const clock = yield* Clock

    const productId = yield* idGen.generateProductId()
    const now = yield* clock.now()

    return MakePilotProduct({
      id: productId,
      label: validated.label,
      type: validated.type,
      category: validated.category,
      description: validated.description,
      variants: createVariants(validated.variants),
      status: validated.status,
      syncStatus: MakeNotSynced(),
      createdAt: now,
      updatedAt: now,
    })
  })

const emitEvent = (
  product: PilotProduct,
  command: PilotProductCreationCommand
): Effect.Effect<void, never, EventPublisher | Clock> =>
  Effect.gen(function* () {
    const publisher = yield* EventPublisher
    const clock = yield* Clock
    const now = yield* clock.now()

    const event = MakePilotProductPublished({
      productId: product.id,
      product,
      correlationId: command.correlationId,
      userId: command.userId,
      timestamp: now,
    })

    // Log error mais ne fait pas échouer la commande
    yield* publisher
      .publish(event)
      .pipe(
        Effect.catchAll((error) =>
          Effect.logError('Failed to publish event').pipe(
            Effect.annotateLogs({ error: String(error) })
          )
        )
      )
  })
```

### Pattern 4 : Query Handler

```typescript
// application/{context}/queries/get-{entity}-by-id.handler.ts
import { Effect, Option } from 'effect'

import type { ProductId, PilotProduct } from '../../../domain/pilot'
import { EntityNotFound } from '../../../domain/pilot'
import { PilotProductRepository } from '../../../ports/driven'

export const getPilotProductById = (
  id: ProductId
): Effect.Effect<PilotProduct, EntityNotFound, PilotProductRepository> =>
  Effect.gen(function* () {
    const repo = yield* PilotProductRepository
    const maybeProduct = yield* repo.findById(id)

    return yield* Option.match(maybeProduct, {
      onNone: () =>
        Effect.fail(
          new EntityNotFound({
            entityType: 'PilotProduct',
            id: String(id),
          })
        ),
      onSome: (product) => Effect.succeed(product),
    })
  })
```

### Pattern 5 : Projection Handler (Read Model)

```typescript
// application/{context}/handlers/catalog-projection.handler.ts
import { Effect } from 'effect'

import type { PilotProductPublished } from '../../../domain/pilot'
import { MakeCatalogProduct, type CatalogProduct } from '../../../domain/catalog'
import { CatalogProductRepository, Clock } from '../../../ports/driven'

export const catalogProjectionHandler = (
  event: PilotProductPublished
): Effect.Effect<CatalogProduct, never, CatalogProductRepository | Clock> =>
  Effect.gen(function* () {
    const repo = yield* CatalogProductRepository
    const clock = yield* Clock
    const now = yield* clock.now()

    // Transformation Write Model → Read Model
    const catalogProduct = MakeCatalogProduct({
      id: event.productId,
      label: event.product.label,
      category: event.product.category,
      thumbnailUrl: event.product.views.front.imageUrl,
      priceRange: event.product.priceRange,
      updatedAt: now,
    })

    return yield* repo.upsert(catalogProduct)
  })
```

### Pattern 6 : Update Handler avec invariant check

```typescript
// application/{context}/handlers/publish-{entity}.handler.ts
import { Effect } from 'effect'

export const handlePublishProduct = (
  command: PublishProductCommand
): Effect.Effect<
  PilotProduct,
  EntityNotFound | InvariantViolation,
  PilotProductRepository | Clock
> =>
  Effect.gen(function* () {
    const repo = yield* PilotProductRepository
    const clock = yield* Clock

    // 1. Récupérer l'aggregate existant
    const maybeProduct = yield* repo.findById(command.productId)
    const product = yield* Option.match(maybeProduct, {
      onNone: () =>
        Effect.fail(
          new EntityNotFound({
            entityType: 'PilotProduct',
            id: String(command.productId),
          })
        ),
      onSome: Effect.succeed,
    })

    // 2. Vérifier l'invariant métier
    if (product.views.additional.length < 2) {
      yield* Effect.fail(
        new InvariantViolation({
          rule: 'min-additional-views',
          message: 'Product must have at least 2 additional views to be published',
        })
      )
    }

    // 3. Appliquer la mutation
    const now = yield* clock.now()
    const updatedProduct = {
      ...product,
      status: ProductStatus.PUBLISHED,
      updatedAt: now,
    }

    // 4. Persister
    return yield* repo.update(updatedProduct)
  })
```

## Structure de fichiers générée

```
application/{context}/
├── commands/
│   ├── create-{entity}.command.ts   # DTO + MakeCommand
│   ├── update-{entity}.command.ts
│   └── index.ts
├── handlers/
│   ├── create-{entity}.handler.ts   # Effect.gen + dépendances
│   ├── create-{entity}.handler.test.ts
│   ├── update-{entity}.handler.ts
│   └── index.ts
├── queries/
│   ├── get-{entity}-by-id.handler.ts
│   ├── list-{entities}.handler.ts
│   └── index.ts
├── validation/
│   ├── {entity}-input.schema.ts     # S.transformOrFail
│   └── index.ts
└── index.ts
```

## Checklist de qualité

- [ ] Signature de type explicite (retour, erreurs, dépendances)
- [ ] Validation des inputs via Schema transformOrFail
- [ ] Erreurs typées et explicites (pas de `Error` générique)
- [ ] Dépendances injectées via `yield*` (pas d'import direct)
- [ ] Events émis uniquement après persistance réussie
- [ ] Logging avec annotations (`Effect.annotateLogs`)
- [ ] Tests d'intégration avec test layer
- [ ] Helpers privés extraits pour lisibilité
