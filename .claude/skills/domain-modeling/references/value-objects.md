# Value Objects

## Branded Types (IDs et scalaires)

Valeurs primitives distinguées au niveau du type :

```typescript
// domain/{context}/value-objects/ids.ts
import * as S from 'effect/Schema'

// =============================================================================
// IDs
// =============================================================================

export const ProductIdSchema = S.String.pipe(S.brand('ProductId'))
export type ProductId = typeof ProductIdSchema.Type
export const MakeProductId = S.decodeUnknownSync(ProductIdSchema)

export const VariantIdSchema = S.String.pipe(S.brand('VariantId'))
export type VariantId = typeof VariantIdSchema.Type
export const MakeVariantId = S.decodeUnknownSync(VariantIdSchema)

// =============================================================================
// SCALAIRES AVEC CONTRAINTES
// =============================================================================

// Label non vide, trimé, 1-255 caractères
export const ProductLabelSchema = S.Trim.pipe(
  S.nonEmptyString(),
  S.maxLength(255),
  S.brand('ProductLabel')
)
export type ProductLabel = typeof ProductLabelSchema.Type

// Prix positif en centimes
export const PriceSchema = S.Number.pipe(S.positive(), S.int(), S.brand('Price'))
export type Price = typeof PriceSchema.Type

// Dimension positive en cm
export const PositiveCmSchema = S.Number.pipe(S.positive(), S.brand('PositiveCm'))
export type PositiveCm = typeof PositiveCmSchema.Type

// URL HTTPS
export const ImageUrlSchema = S.String.pipe(S.pattern(/^https:\/\/.+/), S.brand('ImageUrl'))
export type ImageUrl = typeof ImageUrlSchema.Type
```

## Structs (objets composés)

Value objects composés sans identité :

```typescript
// domain/{context}/value-objects/dimensions.ts
import * as S from 'effect/Schema'
import { PositiveCmSchema } from './scalar-types'

export const CustomDimensionsSchema = S.Struct({
  width: PositiveCmSchema,
  length: PositiveCmSchema,
  height: S.optional(PositiveCmSchema),
})

export type CustomDimensions = typeof CustomDimensionsSchema.Type

// Pas besoin de Data.case pour struct simple
export const MakeCustomDimensions = S.decodeUnknownSync(CustomDimensionsSchema)
```

## Structs imbriqués

```typescript
// domain/{context}/value-objects/views.ts
import * as S from 'effect/Schema'

// Vue unique
export const ProductViewSchema = S.Struct({
  viewType: ViewTypeSchema,
  imageUrl: ImageUrlSchema,
})
export type ProductView = typeof ProductViewSchema.Type

// Structure des vues (front + detail obligatoires, additional optionnels)
export const ProductViewsSchema = S.Struct({
  front: ProductViewSchema,
  detail: ProductViewSchema,
  additional: S.Array(ProductViewSchema),
})
export type ProductViews = typeof ProductViewsSchema.Type
```

## Avantages des Branded Types

1. **Type safety** : Impossible de confondre `ProductId` et `OrderId`
2. **Validation runtime** : `MakeProductId` valide à l'exécution
3. **Documentation** : Le type communique l'intention
4. **Refactoring safe** : Le compilateur détecte les erreurs

```typescript
// ❌ Compile error - types incompatibles
const orderId: OrderId = productId

// ✅ Conversion explicite si nécessaire
const orderId = MakeOrderId(String(productId))
```

## Checklist

- [ ] IDs toujours brandés (`S.brand('EntityId')`)
- [ ] Scalaires avec contraintes (`positive`, `nonEmptyString`, etc.)
- [ ] Constructeur `Make{Type}` avec `S.decodeUnknownSync`
- [ ] Types extraits du schema
- [ ] Pas de `Data.case` pour structs simples (réserver aux TaggedStruct)
