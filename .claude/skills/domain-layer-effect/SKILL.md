---
name: domain-layer-effect
description: Modélise aggregates, entities et value objects avec Effect Schema. Utiliser pour créer ou étendre des structures de domaine type-safe et immuables.
---

# Domain Layer Builder

## Quand utiliser ce skill

- "Créer un aggregate [nom] avec les propriétés [...]"
- "Ajouter un value object [nom] pour représenter [concept]"
- "Modéliser une entité [nom] avec ses invariants"
- "Créer une union discriminée pour [états/types]"

## Contexte nécessaire

1. **Type de structure** : Aggregate, Entity, ou Value Object
2. **Propriétés** et leurs types (string, number, Date, etc.)
3. **Invariants** : règles métier qui doivent toujours être vraies
4. **Relations** : liens avec d'autres structures du domaine

## Workflow

### 1. Analyse

Questions à se poser :

- Cette structure a-t-elle une identité ? → Entity ou Aggregate
- Est-ce un concept sans identité propre ? → Value Object
- Y a-t-il des états distincts avec transitions ? → Union discriminée
- Quels invariants doivent être garantis ?

### 2. Génération

Choisir le pattern approprié :

| Type                  | Caractéristique                | Pattern                        |
| --------------------- | ------------------------------ | ------------------------------ |
| Aggregate Root        | Identité + invariants + events | `S.TaggedStruct` + `Data.case` |
| Entity                | Identité + cycle de vie        | `S.TaggedStruct` + `Data.case` |
| Value Object (simple) | Pas d'identité, immuable       | `S.brand()` ou `S.Struct`      |
| Value Object (union)  | Plusieurs états possibles      | `S.Union` + `S.TaggedStruct`   |

### 3. Validation

- [ ] Structure immuable via `Data.case()`
- [ ] Schema Effect pour validation
- [ ] Constructeur `Make{Name}` exporté
- [ ] Types extraits du Schema (`typeof Schema.Type`)

## Patterns techniques

### Pattern 1 : Branded Type (ID, valeurs simples)

Pour des valeurs primitives qui doivent être distinguées au niveau du type.

```typescript
// domain/{context}/value-objects/ids.ts
import * as S from 'effect/Schema'

// Branded string - garantit qu'on ne peut pas confondre ProductId et OrderId
export const ProductIdSchema = S.String.pipe(S.brand('ProductId'))
export type ProductId = typeof ProductIdSchema.Type

// Décoder depuis une valeur inconnue (runtime validation)
export const MakeProductId = S.decodeUnknownSync(ProductIdSchema)

// Branded number
export const PriceSchema = S.Number.pipe(S.positive(), S.brand('Price'))
export type Price = typeof PriceSchema.Type

// Branded string avec contrainte
export const EmailSchema = S.String.pipe(S.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/), S.brand('Email'))
export type Email = typeof EmailSchema.Type
```

### Pattern 2 : Value Object simple (struct)

Pour des objets composés sans états alternatifs.

```typescript
// domain/{context}/value-objects/dimensions.ts
import * as S from 'effect/Schema'

export const DimensionsSchema = S.Struct({
  width: S.Number.pipe(S.positive()),
  length: S.Number.pipe(S.positive()),
  height: S.optional(S.Number.pipe(S.positive())),
})

export type Dimensions = typeof DimensionsSchema.Type

// Constructeur simple (pas besoin de Data.case pour struct simple)
export const MakeDimensions = S.decodeUnknownSync(DimensionsSchema)
```

### Pattern 3 : Value Object union discriminée

Pour des valeurs avec plusieurs états distincts (state machine, variantes).

```typescript
// domain/{context}/value-objects/sync-status.ts
import { Data } from 'effect'
import * as S from 'effect/Schema'

// État 1 : Non synchronisé
const NotSyncedSchema = S.TaggedStruct('NotSynced', {})
export type NotSynced = typeof NotSyncedSchema.Type

// État 2 : Synchronisé avec succès
const SyncedSchema = S.TaggedStruct('Synced', {
  externalId: S.String,
  syncedAt: S.Date,
})
export type Synced = typeof SyncedSchema.Type

// État 3 : Échec de synchronisation
const SyncFailedSchema = S.TaggedStruct('SyncFailed', {
  error: S.Struct({
    code: S.String,
    message: S.String,
  }),
  failedAt: S.Date,
  attempts: S.Number,
})
export type SyncFailed = typeof SyncFailedSchema.Type

// Union des états
export const SyncStatusSchema = S.Union(NotSyncedSchema, SyncedSchema, SyncFailedSchema)
export type SyncStatus = typeof SyncStatusSchema.Type

// Constructeurs immuables
export const MakeNotSynced = (): NotSynced => Data.case<NotSynced>()({ _tag: 'NotSynced' })

export const MakeSynced = (params: Omit<Synced, '_tag'>): Synced =>
  Data.case<Synced>()({ _tag: 'Synced', ...params })

export const MakeSyncFailed = (params: Omit<SyncFailed, '_tag'>): SyncFailed =>
  Data.case<SyncFailed>()({ _tag: 'SyncFailed', ...params })
```

### Pattern 4 : Entity (sous-objet avec identité)

```typescript
// domain/{context}/entities/variant.ts
import { Data } from 'effect'
import * as S from 'effect/Schema'

// Variante standard (tailles prédéfinies)
const StandardVariantSchema = S.TaggedStruct('StandardVariant', {
  size: SizeSchema, // enum Size { SMALL, MEDIUM, LARGE }
})
export type StandardVariant = typeof StandardVariantSchema.Type

// Variante custom (dimensions sur mesure)
const CustomVariantSchema = S.TaggedStruct('CustomVariant', {
  size: S.Literal(Size.CUSTOM),
  customDimensions: DimensionsSchema,
  price: PriceSchema,
})
export type CustomVariant = typeof CustomVariantSchema.Type

// Union des variantes
export const ProductVariantSchema = S.Union(StandardVariantSchema, CustomVariantSchema)
export type ProductVariant = typeof ProductVariantSchema.Type

// Constructeurs
export const MakeStandardVariant = (params: Omit<StandardVariant, '_tag'>): StandardVariant =>
  Data.case<StandardVariant>()({ _tag: 'StandardVariant', ...params })

export const MakeCustomVariant = (params: Omit<CustomVariant, '_tag'>): CustomVariant =>
  Data.case<CustomVariant>()({ _tag: 'CustomVariant', ...params })
```

### Pattern 5 : Aggregate Root

```typescript
// domain/{context}/aggregate.ts
import { Data } from 'effect'
import * as S from 'effect/Schema'

// Schema avec invariants encodés
const PilotProductSchema = S.TaggedStruct('PilotProduct', {
  id: ProductIdSchema,
  label: S.String.pipe(S.nonEmptyString()),
  description: S.String,
  category: ProductCategorySchema,
  // Invariant: au moins une variante (NonEmptyArray)
  variants: S.NonEmptyArray(ProductVariantSchema),
  status: ProductStatusSchema,
  syncStatus: SyncStatusSchema,
  createdAt: S.Date,
  updatedAt: S.Date,
})

export type PilotProduct = typeof PilotProductSchema.Type

// Constructeur immuable
export const MakePilotProduct = (params: Omit<PilotProduct, '_tag'>): PilotProduct =>
  Data.case<PilotProduct>()({ _tag: 'PilotProduct', ...params })
```

### Pattern 6 : Domain Event

```typescript
// domain/{context}/events.ts
import { Data } from 'effect'
import * as S from 'effect/Schema'

const PilotProductPublishedSchema = S.TaggedStruct('PilotProductPublished', {
  // Identifiant de l'entité concernée
  productId: ProductIdSchema,
  // Données de l'event (snapshot ou delta)
  product: S.Any as S.Schema<PilotProduct>,
  // Metadata pour traçabilité
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type PilotProductPublished = typeof PilotProductPublishedSchema.Type

export const MakePilotProductPublished = (
  params: Omit<PilotProductPublished, '_tag'>
): PilotProductPublished =>
  Data.case<PilotProductPublished>()({ _tag: 'PilotProductPublished', ...params })

// Union de tous les events du contexte
export type PilotDomainEvent = PilotProductPublished | PilotProductSynced
```

### Pattern 7 : Domain Service (State Machine)

```typescript
// domain/{context}/services/sync-status.machine.ts

export const SyncStatusMachine = {
  // État initial
  initial: (): NotSynced => MakeNotSynced(),

  // Transitions
  markSynced: (_current: NotSynced | SyncFailed, externalId: string, syncedAt: Date): Synced =>
    MakeSynced({ externalId, syncedAt }),

  markFailed: (
    current: SyncStatus,
    error: { code: string; message: string },
    failedAt: Date
  ): SyncFailed =>
    MakeSyncFailed({
      error,
      failedAt,
      attempts: current._tag === 'SyncFailed' ? current.attempts + 1 : 1,
    }),

  // Type guards pour transitions valides
  canSync: (status: SyncStatus): status is NotSynced | SyncFailed =>
    status._tag === 'NotSynced' || status._tag === 'SyncFailed',

  canRetry: (status: SyncStatus): status is SyncFailed =>
    status._tag === 'SyncFailed' && status.attempts < 3,
}
```

## Structure de fichiers générée

```
domain/{context}/
├── aggregate.ts              # S.TaggedStruct + Data.case
├── entities/
│   ├── {entity}.ts           # Sous-entités avec _tag
│   └── index.ts
├── value-objects/
│   ├── ids.ts                # Branded types pour IDs
│   ├── {concept}.ts          # VOs simples ou unions
│   └── index.ts
├── events.ts                 # Domain events avec metadata
├── errors.ts                 # TaggedError
├── enums.ts                  # S.Enums()
├── services/
│   ├── {name}.machine.ts     # State machines
│   └── index.ts
└── index.ts                  # Barrel export
```

## Checklist de qualité

- [ ] Tous les IDs utilisent des branded types
- [ ] Structures immuables via `Data.case()`
- [ ] Schemas Effect pour validation runtime
- [ ] Types extraits des Schemas (pas de duplication)
- [ ] `_tag` discriminator sur toutes les unions
- [ ] Constructeurs `Make{Name}` pour chaque type
- [ ] Invariants documentés en commentaires
- [ ] NonEmptyArray pour les collections avec minimum requis
