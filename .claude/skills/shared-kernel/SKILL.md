---
name: shared-kernel
description: 'Ajoute et modifie les types et services partagés dans @maison-amane/shared-kernel : branded IDs cross-context, enums partagés, configs infrastructure, messaging topology. Utiliser quand: (1) Ajouter un branded ID partagé, (2) Ajouter un enum cross-context, (3) Modifier la topologie RabbitMQ (exchange, routing key), (4) Ajouter/modifier une config infrastructure, (5) Ajouter un type au shared-kernel, (6) Add a shared ID, (7) Add a cross-context enum, (8) Modify messaging topology, (9) Add infrastructure config, (10) Add a shared type.'
---

# Shared Kernel Skill

## Workflow

1. **Vérifier le critère d'admission** : Le type/service est-il réellement cross-context (utilisé par 2+ BC) ? — cf. ADR-9
2. **Identifier la catégorie** : branded ID, enum, config, messaging
3. **Lire le fichier de référence correspondant** pour suivre le pattern existant
4. **Créer/modifier le type** en suivant les conventions du shared-kernel
5. **Exporter** depuis le barrel (`index.ts`)
6. **Vérifier les imports** dans les BC consommateurs

## Rules & Conventions

### Critère d'admission (ADR-9)

- Un type va dans shared-kernel **SEULEMENT** s'il est utilisé par **2+ bounded contexts**
- Un type métier spécifique à un BC **n'y va JAMAIS** (même s'il "pourrait" être utile plus tard)
- **Préférer la duplication au couplage inadéquat** — si deux BC ont un concept similaire mais pas identique, dupliquer
- Shared-kernel = **types + configs uniquement** — JAMAIS de logique métier, JAMAIS d'erreurs spécifiques à un BC

**Exemples valides** : `ProductId` (Pilot + Catalog), `ProductCategory` (Pilot + Catalog + Production), `ROUTING_KEYS.PILOT` (contrat publisher/consumer)

**Exemples invalides** : `PilotProduct` (spécifique BC Pilot), `ProductNotFoundError` (spécifique BC Pilot)

### Branded ID cross-context

Pattern identique au skill `domain-model` pour les branded IDs :

```typescript
// packages/shared-kernel/src/domain/value-objects/product-id.ts
import * as S from 'effect/Schema'

export const ProductIdSchema = S.String.pipe(S.brand('ProductId'))
export type ProductId = typeof ProductIdSchema.Type
export const makeProductId = S.decodeUnknownSync(ProductIdSchema)
```

**Emplacement** : `packages/shared-kernel/src/domain/value-objects/`
**Export** : `packages/shared-kernel/src/domain/value-objects/index.ts`

### Enum partagé

Enum + Schema + constructor `make{Enum}` :

```typescript
// packages/shared-kernel/src/domain/value-objects/product-enums.ts
import * as S from 'effect/Schema'

export const ProductCategory = {
  RUNNER: 'RUNNER',
  STANDARD: 'STANDARD',
} as const

export type ProductCategory = (typeof ProductCategory)[keyof typeof ProductCategory]

export const ProductCategorySchema = S.Literal('RUNNER', 'STANDARD')
export const makeProductCategory = S.decodeUnknownSync(ProductCategorySchema)
```

**Emplacement** : `packages/shared-kernel/src/domain/value-objects/`
**Export** : `packages/shared-kernel/src/domain/value-objects/index.ts`

### Messaging topology

**Emplacement** : `packages/shared-kernel/src/messaging/topology.ts`

Exchanges et routing keys — contrat entre publisher et consumer :

```typescript
export const EXCHANGES = {
  PILOT_EVENTS: 'pilot.events',
} as const

export const ROUTING_KEYS = {
  PILOT: {
    PRODUCT_PUBLISHED: 'product.published',
    PRODUCT_UPDATED: 'product.updated',
  },
} as const
```

**Convention routing key** : `{entity}.{action}` en minuscule (ex: `product.published`, `order.created`)

### Config infrastructure

Objet readonly avec valeurs depuis env vars :

```typescript
// packages/shared-kernel/src/infrastructure/config/mongo.config.ts
export const mongoConfig = {
  uri: process.env.MONGO_URI ?? 'mongodb://localhost:27017',
  database: process.env.MONGO_DB ?? 'maison-amane',
} as const
```

**Emplacement** : `packages/shared-kernel/src/infrastructure/config/`
**Export** : `packages/shared-kernel/src/infrastructure/config/index.ts`

## Reference Files

| Pattern                   | File                                                               |
| ------------------------- | ------------------------------------------------------------------ |
| Branded IDs               | `packages/shared-kernel/src/domain/value-objects/product-id.ts`    |
| Enums                     | `packages/shared-kernel/src/domain/value-objects/product-enums.ts` |
| Messaging topology        | `packages/shared-kernel/src/messaging/topology.ts`                 |
| Config infrastructure     | `packages/shared-kernel/src/infrastructure/config/mongo.config.ts` |
| ADR-9 (critère admission) | `CONTEXT.md` section "ADR-9: Politique du Shared Kernel"           |

## Quality Checklist

- [ ] Le type est utilisé par **2+ bounded contexts** ?
- [ ] Ce n'est PAS de la logique métier ni une erreur spécifique à un BC ?
- [ ] Pattern existant respecté (branded ID / enum / topology / config) ?
- [ ] Fichier de référence lu avant modification ?
- [ ] Export depuis le barrel (`index.ts`) ?
