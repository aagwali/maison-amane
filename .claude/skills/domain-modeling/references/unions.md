# Unions Discriminées

## Pattern de base

Pour représenter plusieurs états exclusifs :

```typescript
// domain/{context}/value-objects/sync-status.ts
import { Data } from 'effect'
import * as S from 'effect/Schema'

// =============================================================================
// VARIANTES
// =============================================================================

// État 1 : Non synchronisé
const NotSyncedSchema = S.TaggedStruct('NotSynced', {})
export type NotSynced = typeof NotSyncedSchema.Type

// État 2 : Synchronisé avec succès
const SyncedSchema = S.TaggedStruct('Synced', {
  shopifyProductId: ShopifyProductIdSchema,
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
  attempts: S.Number.pipe(S.int(), S.positive()),
})
export type SyncFailed = typeof SyncFailedSchema.Type

// =============================================================================
// UNION
// =============================================================================

export const SyncStatusSchema = S.Union(NotSyncedSchema, SyncedSchema, SyncFailedSchema)
export type SyncStatus = typeof SyncStatusSchema.Type

// =============================================================================
// CONSTRUCTEURS
// =============================================================================

export const MakeNotSynced = (): NotSynced => Data.case<NotSynced>()({ _tag: 'NotSynced' })

export const MakeSynced = (params: Omit<Synced, '_tag'>): Synced =>
  Data.case<Synced>()({ _tag: 'Synced', ...params })

export const MakeSyncFailed = (params: Omit<SyncFailed, '_tag'>): SyncFailed =>
  Data.case<SyncFailed>()({ _tag: 'SyncFailed', ...params })
```

## Variantes d'entités

Pour des entités avec structures différentes :

```typescript
// domain/{context}/value-objects/variants.ts

// Variante standard (tailles prédéfinies)
const StandardVariantSchema = S.TaggedStruct('StandardVariant', {
  id: VariantIdSchema,
  size: SizeSchema, // enum: REGULAR, LARGE
})

// Variante custom (dimensions sur mesure)
const CustomVariantSchema = S.TaggedStruct('CustomVariant', {
  id: VariantIdSchema,
  size: S.Literal(Size.CUSTOM),
  customDimensions: CustomDimensionsSchema,
  price: PriceSchema,
})

// Union
export const ProductVariantSchema = S.Union(StandardVariantSchema, CustomVariantSchema)
export type ProductVariant = typeof ProductVariantSchema.Type

// Constructeurs
export const MakeStandardVariant = (params: Omit<StandardVariant, '_tag'>): StandardVariant =>
  Data.case<StandardVariant>()({ _tag: 'StandardVariant', ...params })

export const MakeCustomVariant = (params: Omit<CustomVariant, '_tag'>): CustomVariant =>
  Data.case<CustomVariant>()({ _tag: 'CustomVariant', ...params })
```

## Pattern matching

Utiliser `_tag` pour le pattern matching :

```typescript
const getPrice = (variant: ProductVariant): number => {
  switch (variant._tag) {
    case 'StandardVariant':
      return STANDARD_PRICES[variant.size]
    case 'CustomVariant':
      return variant.price
  }
}

// Avec exhaustiveness check
const formatVariant = (variant: ProductVariant): string => {
  switch (variant._tag) {
    case 'StandardVariant':
      return `Standard: ${variant.size}`
    case 'CustomVariant':
      return `Custom: ${variant.customDimensions.width}x${variant.customDimensions.length}`
    default:
      // TypeScript erreur si cas manquant
      const _exhaustive: never = variant
      return _exhaustive
  }
}
```

## Type guards

```typescript
export const isStandardVariant = (v: ProductVariant): v is StandardVariant =>
  v._tag === 'StandardVariant'

export const isCustomVariant = (v: ProductVariant): v is CustomVariant => v._tag === 'CustomVariant'

// Usage
if (isCustomVariant(variant)) {
  console.log(variant.customDimensions) // TypeScript sait que c'est CustomVariant
}
```

## Checklist

- [ ] Chaque variante a un `S.TaggedStruct` avec `_tag` unique
- [ ] Union créée avec `S.Union(...)`
- [ ] Constructeurs `Make{Variant}` pour chaque variante
- [ ] Type guards si pattern matching fréquent
- [ ] Propriétés spécifiques à chaque variante clairement identifiées
