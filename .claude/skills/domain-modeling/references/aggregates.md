# Aggregates

## Pattern complet

```typescript
// domain/{context}/aggregate.ts
import { Data } from 'effect'
import * as S from 'effect/Schema'

import { ProductIdSchema, VariantIdSchema } from './value-objects'
import { ProductStatusSchema } from './enums'
import { ProductVariantSchema } from './value-objects/variants'
import { ProductViewsSchema } from './value-objects/views'
import { SyncStatusSchema } from './value-objects/sync-status'

// =============================================================================
// AGGREGATE SCHEMA
// =============================================================================

const PilotProductSchema = S.TaggedStruct('PilotProduct', {
  // Identité
  id: ProductIdSchema,

  // Propriétés métier
  label: S.String.pipe(S.nonEmptyString()),
  description: S.String,
  category: ProductCategorySchema,

  // Invariants encodés dans le type
  variants: S.NonEmptyArray(ProductVariantSchema), // Au moins 1 variante
  views: ProductViewsSchema, // Structure validée

  // État
  status: ProductStatusSchema,
  syncStatus: SyncStatusSchema,

  // Audit
  createdAt: S.Date,
  updatedAt: S.Date,
})

export type PilotProduct = typeof PilotProductSchema.Type

// =============================================================================
// CONSTRUCTEUR IMMUABLE
// =============================================================================

export const MakePilotProduct = (params: Omit<PilotProduct, '_tag'>): PilotProduct =>
  Data.case<PilotProduct>()({ _tag: 'PilotProduct', ...params })
```

## Invariants

Les invariants sont des règles métier qui doivent toujours être vraies :

```typescript
// Invariant : au moins une variante
variants: S.NonEmptyArray(ProductVariantSchema)

// Invariant : prix positif
price: S.Number.pipe(S.positive(), S.brand('Price'))

// Invariant : label non vide
label: S.String.pipe(S.nonEmptyString())

// Invariant : minimum d'éléments
views: S.Array(ViewSchema).pipe(S.minItems(4))
```

## Sous-entités (Entities)

Entités internes à l'aggregate avec leur propre identité :

```typescript
// Variante standard
const StandardVariantSchema = S.TaggedStruct('StandardVariant', {
  id: VariantIdSchema,
  size: SizeSchema,
})

// Variante custom
const CustomVariantSchema = S.TaggedStruct('CustomVariant', {
  id: VariantIdSchema,
  size: S.Literal(Size.CUSTOM),
  customDimensions: DimensionsSchema,
  price: PriceSchema,
})

// Union des variantes
export const ProductVariantSchema = S.Union(StandardVariantSchema, CustomVariantSchema)
export type ProductVariant = typeof ProductVariantSchema.Type
```

## Mutations

L'aggregate est immuable. Les mutations créent une nouvelle instance :

```typescript
// Dans un handler ou domain service
const updateStatus = (product: PilotProduct, newStatus: ProductStatus, now: Date): PilotProduct =>
  MakePilotProduct({
    ...product,
    status: newStatus,
    updatedAt: now,
  })
```

## Checklist

- [ ] `S.TaggedStruct` avec `_tag` unique
- [ ] `Data.case<T>()` pour constructeur immuable
- [ ] Invariants encodés dans le schema (NonEmptyArray, positive, etc.)
- [ ] Types extraits du schema (`typeof Schema.Type`)
- [ ] Constructeur `Make{Entity}` exporté
- [ ] Pas de méthodes sur l'objet (domain services séparés)
