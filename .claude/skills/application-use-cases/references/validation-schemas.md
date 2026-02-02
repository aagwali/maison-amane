# Validation Schemas

## S.transformOrFail Pattern

Pour transformer des inputs bruts (strings) en types domain (branded, enums) :

```typescript
// application/{context}/validation/variant-input.schema.ts
import { Effect } from 'effect'
import * as S from 'effect/Schema'
import type { ParseResult } from 'effect/ParseResult'

import { Size } from '../../../domain/{context}'

// =============================================================================
// INPUT SCHEMA (raw)
// =============================================================================

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

// =============================================================================
// OUTPUT SCHEMAS (validated)
// =============================================================================

const ValidatedStandardVariantSchema = S.Struct({
  _tag: S.Literal('StandardVariant'),
  size: SizeSchema, // enum
})

const ValidatedCustomVariantSchema = S.Struct({
  _tag: S.Literal('CustomVariant'),
  size: S.Literal(Size.CUSTOM),
  customDimensions: CustomDimensionsSchema,
  price: PriceSchema,
})

// =============================================================================
// TRANSFORMATION
// =============================================================================

export const ValidatedVariantSchema = S.transformOrFail(
  UnvalidatedVariantSchema,
  S.Union(ValidatedStandardVariantSchema, ValidatedCustomVariantSchema),
  {
    strict: true,
    decode: (input) => {
      // Logique conditionnelle
      if (input.size === 'CUSTOM') {
        // Custom variant requiert dimensions et prix
        if (!input.customDimensions || !input.price) {
          return Effect.fail(
            new S.ParseError([
              /* error details */
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

      // Standard variant
      return S.decodeUnknown(ValidatedStandardVariantSchema)({
        _tag: 'StandardVariant',
        size: input.size,
      }).pipe(Effect.mapError((e) => e.issue))
    },
    encode: (validated) => {
      // Reverse transformation
      if (validated._tag === 'CustomVariant') {
        return Effect.succeed({
          size: 'CUSTOM',
          customDimensions: validated.customDimensions,
          price: validated.price,
        })
      }
      return Effect.succeed({ size: validated.size })
    },
  }
)

export type ValidatedVariant = typeof ValidatedVariantSchema.Type
```

## Fonction de validation

Wrapper pour utilisation dans handlers :

```typescript
// application/{context}/validation/product-data.schema.ts
import { Effect } from 'effect'
import * as S from 'effect/Schema'

import { ValidationError } from '../../../domain/{context}'

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

## Validations avec S.filter

Pour des règles métier complexes :

```typescript
// Validation de structure de vues
export const ValidatedViewsSchema = S.Array(ProductViewSchema).pipe(
  // Minimum 4 vues
  S.filter((views) => views.length >= MIN_VIEWS, {
    message: () => `At least ${MIN_VIEWS} views required`,
  }),
  // Vue FRONT obligatoire
  S.filter((views) => views.some((v) => v.viewType === ViewType.FRONT), {
    message: () => 'FRONT view is required',
  }),
  // Vue DETAIL obligatoire
  S.filter((views) => views.some((v) => v.viewType === ViewType.DETAIL), {
    message: () => 'DETAIL view is required',
  })
)
```

## Schema composé complet

```typescript
export const ValidatedProductDataSchema = S.Struct({
  label: ProductLabelSchema,
  type: ProductTypeSchema,
  category: ProductCategorySchema,
  description: ProductDescriptionSchema,
  priceRange: PriceRangeSchema,
  variants: S.NonEmptyArray(ValidatedVariantSchema),
  views: ValidatedViewsSchema,
  status: ProductStatusSchema,
}).pipe(
  // Transformation finale : structurer les vues
  S.transform(ValidatedProductDataWithStructuredViewsSchema, {
    decode: (data) => ({
      ...data,
      views: structureViews(data.views),
    }),
    encode: (data) => ({
      ...data,
      views: flattenViews(data.views),
    }),
  })
)
```

## Cas d'usage

| Situation                 | Pattern                          |
| ------------------------- | -------------------------------- |
| String → Enum             | `S.Enums(MyEnum)` directement    |
| String → Branded          | `S.brand('TypeName')`            |
| Validation conditionnelle | `S.transformOrFail` avec logique |
| Règles métier             | `S.filter` chaînés               |
| Restructuration           | `S.transform`                    |

## Checklist

- [ ] Input schema avec types bruts (strings)
- [ ] Output schema avec types domain (branded, enums)
- [ ] `S.transformOrFail` pour logique conditionnelle
- [ ] `S.filter` pour invariants
- [ ] Fonction wrapper `validate{Entity}Data`
- [ ] Map errors vers `ValidationError` domain
- [ ] Tests de validation (valid/invalid inputs)
