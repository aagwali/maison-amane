# MongoDB Mappers

## Pattern de base

```typescript
// infrastructure/persistence/mongodb/mappers/{entity}.mapper.ts
import {
  Make{Entity},
  Make{Entity}Id,
  type {Entity},
} from '../../../../domain/{context}'

// =============================================================================
// DOCUMENT TYPE
// =============================================================================

export interface {Entity}Document {
  _id: string                    // ID comme string (pas ObjectId)
  label: string
  status: string                 // Enums stockés comme strings
  // ... autres champs
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// DOMAIN -> DOCUMENT
// =============================================================================

export const {camelEntity}ToDocument = ({camelEntity}: {Entity}): {Entity}Document => ({
  _id: {camelEntity}.id,
  label: {camelEntity}.label,
  status: {camelEntity}.status,
  // ... map autres champs
  createdAt: {camelEntity}.createdAt,
  updatedAt: {camelEntity}.updatedAt,
})

// =============================================================================
// DOCUMENT -> DOMAIN
// =============================================================================

export const {camelEntity}FromDocument = (doc: {Entity}Document): {Entity} =>
  Make{Entity}({
    id: Make{Entity}Id(doc._id),
    label: doc.label,
    status: doc.status as {Entity}Status,   // Cast enum
    // ... map autres champs
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  })
```

## Mapping de types complexes

### Enums

```typescript
// Domain -> Document : utiliser directement (enum value = string)
status: product.status,

// Document -> Domain : cast
status: doc.status as ProductStatus,
```

### Branded types

```typescript
// Domain -> Document : value brute
_id: product.id,         // ProductId -> string automatiquement

// Document -> Domain : constructeur
id: MakeProductId(doc._id),
```

### Unions discriminées

```typescript
// Domain -> Document
const variantToDocument = (variant: ProductVariant): VariantDocument => {
  if (variant._tag === 'StandardVariant') {
    return {
      _tag: 'StandardVariant',
      id: variant.id,
      size: variant.size,
    }
  }
  return {
    _tag: 'CustomVariant',
    id: variant.id,
    size: variant.size,
    customDimensions: variant.customDimensions,
    price: variant.price,
  }
}

// Document -> Domain
const variantFromDocument = (doc: VariantDocument): ProductVariant => {
  if (doc._tag === 'StandardVariant') {
    return MakeStandardVariant({
      id: MakeVariantId(doc.id),
      size: doc.size as Size,
    })
  }
  return MakeCustomVariant({
    id: MakeVariantId(doc.id),
    size: Size.CUSTOM,
    customDimensions: MakeCustomDimensions(doc.customDimensions),
    price: MakePrice(doc.price),
  })
}
```

### Objets imbriqués

```typescript
// Sync status union
const syncStatusToDocument = (status: SyncStatus): SyncStatusDocument => {
  switch (status._tag) {
    case 'NotSynced':
      return { _tag: 'NotSynced' }
    case 'Synced':
      return {
        _tag: 'Synced',
        shopifyProductId: status.shopifyProductId,
        syncedAt: status.syncedAt,
      }
    case 'SyncFailed':
      return {
        _tag: 'SyncFailed',
        error: status.error,
        failedAt: status.failedAt,
        attempts: status.attempts,
      }
  }
}

const syncStatusFromDocument = (doc: SyncStatusDocument): SyncStatus => {
  switch (doc._tag) {
    case 'NotSynced':
      return MakeNotSynced()
    case 'Synced':
      return MakeSynced({
        shopifyProductId: MakeShopifyProductId(doc.shopifyProductId),
        syncedAt: doc.syncedAt,
      })
    case 'SyncFailed':
      return MakeSyncFailed({
        error: doc.error,
        failedAt: doc.failedAt,
        attempts: doc.attempts,
      })
  }
}
```

## Document type complet

```typescript
export interface PilotProductDocument {
  _id: string
  label: string
  type: string
  category: string
  description: string
  priceRange: string
  variants: VariantDocument[]
  views: ViewsDocument
  status: string
  syncStatus: SyncStatusDocument
  createdAt: Date
  updatedAt: Date
}

interface VariantDocument {
  _tag: 'StandardVariant' | 'CustomVariant'
  id: string
  size: string
  customDimensions?: { width: number; length: number }
  price?: number
}

interface ViewsDocument {
  front: { viewType: string; imageUrl: string }
  detail: { viewType: string; imageUrl: string }
  additional: { viewType: string; imageUrl: string }[]
}

interface SyncStatusDocument {
  _tag: 'NotSynced' | 'Synced' | 'SyncFailed'
  shopifyProductId?: string
  syncedAt?: Date
  error?: { code: string; message: string }
  failedAt?: Date
  attempts?: number
}
```

## Checklist

- [ ] Document interface avec `_id: string`
- [ ] Enums stockés comme strings
- [ ] Unions préservent `_tag` discriminator
- [ ] Fonctions `toDocument` et `fromDocument`
- [ ] Helpers pour types complexes (variants, nested)
- [ ] Constructeurs domain utilisés dans `fromDocument`
- [ ] Mappers exportés individuellement (testables)
