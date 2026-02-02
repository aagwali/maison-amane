# Fixtures et Builders

## Données de test valides

```typescript
// test-utils/fixtures/{entity}.fixtures.ts
import {
  ProductCategory,
  ProductStatus,
  ProductType,
  PriceRange,
  Size,
  ViewType,
} from '../../domain/pilot'
import type { UnvalidatedProductData } from '../../application/pilot/commands'

// =============================================================================
// DONNÉES VALIDES PAR DÉFAUT
// =============================================================================

export const validProductData: UnvalidatedProductData = {
  label: 'Test Product',
  type: ProductType.TAPIS,
  category: ProductCategory.RUNNER,
  description: 'A test product description',
  priceRange: PriceRange.PREMIUM,
  variants: [{ size: Size.REGULAR }, { size: Size.LARGE }],
  views: [
    { viewType: ViewType.FRONT, imageUrl: 'https://cdn.example.com/front.jpg' },
    { viewType: ViewType.DETAIL, imageUrl: 'https://cdn.example.com/detail.jpg' },
    { viewType: ViewType.BACK, imageUrl: 'https://cdn.example.com/back.jpg' },
    { viewType: ViewType.AMBIANCE, imageUrl: 'https://cdn.example.com/ambiance.jpg' },
  ],
  status: ProductStatus.DRAFT,
}
```

## Builder Pattern

```typescript
// =============================================================================
// BUILDER POUR VARIATIONS
// =============================================================================

export const buildProductData = (
  overrides: Partial<UnvalidatedProductData> = {}
): UnvalidatedProductData => ({
  ...validProductData,
  ...overrides,
})

// Usage
const customData = buildProductData({ label: 'Custom Label', status: 'PUBLISHED' })
```

## Données invalides

```typescript
// =============================================================================
// DONNÉES INVALIDES (pour tests d'erreur)
// =============================================================================

export const invalidProductData = {
  emptyLabel: buildProductData({ label: '' }),
  blankLabel: buildProductData({ label: '   ' }),
  noVariants: buildProductData({ variants: [] }),
  missingViews: buildProductData({ views: [] }),
  invalidStatus: buildProductData({ status: 'INVALID' as any }),
}

// Usage
const command = buildCommand(invalidProductData.emptyLabel)
```

## Command Builder

```typescript
// test-utils/fixtures/command.fixtures.ts
import { MakeCorrelationId, MakeUserId } from '../../domain/shared'
import {
  MakeCreateProductCommand,
  type UnvalidatedProductData,
} from '../../application/pilot/commands'
import { validProductData, TEST_DATE } from './'

interface CommandOverrides {
  correlationId?: string
  userId?: string
  timestamp?: Date
}

export const buildCommand = (
  data: UnvalidatedProductData = validProductData,
  overrides: CommandOverrides = {}
) =>
  MakeCreateProductCommand({
    data,
    correlationId: MakeCorrelationId(overrides.correlationId ?? 'test-correlation-id'),
    userId: MakeUserId(overrides.userId ?? 'test-user'),
    timestamp: overrides.timestamp ?? TEST_DATE,
  })
```

## Factory Functions

```typescript
// Pour les value objects
export const makeView = (viewType: ViewType, suffix = ''): ProductView => ({
  viewType,
  imageUrl: `https://cdn.example.com/${viewType.toLowerCase()}${suffix}.jpg`,
})

// Pour les variants
export const makeStandardVariant = (size: Size = Size.REGULAR) => ({
  size,
})

export const makeCustomVariant = (width: number, length: number, price: number) => ({
  size: 'CUSTOM',
  customDimensions: { width, length },
  price,
})
```

## Aggregate Fixtures (pour tests de services)

```typescript
// test-utils/fixtures/domain.fixtures.ts
import {
  MakePilotProduct,
  MakeProductId,
  MakeNotSynced,
  ProductStatus,
  // ...
} from '../../domain/pilot'

export const makeProduct = (overrides: Partial<Omit<PilotProduct, '_tag'>> = {}): PilotProduct =>
  MakePilotProduct({
    id: MakeProductId('test-product-1'),
    label: 'Test Product',
    type: ProductType.TAPIS,
    category: ProductCategory.RUNNER,
    description: 'Description',
    priceRange: PriceRange.PREMIUM,
    variants: [MakeStandardVariant({ id: MakeVariantId('v-1'), size: Size.REGULAR })],
    views: {
      front: makeView(ViewType.FRONT),
      detail: makeView(ViewType.DETAIL),
      additional: [],
    },
    status: ProductStatus.DRAFT,
    syncStatus: MakeNotSynced(),
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
    ...overrides,
  })
```

## Structure de fichiers

```
test-utils/
├── constants.ts                    # TEST_DATE
├── deterministic-id-generator.ts
├── fixed-clock.ts
├── spy-event-publisher.ts
├── test-layer.ts
├── fixtures/
│   ├── product.fixtures.ts         # Données de test
│   ├── command.fixtures.ts         # Builders de commandes
│   ├── domain.fixtures.ts          # Builders d'aggregates
│   └── index.ts
└── index.ts                        # Barrel export
```

## Checklist

- [ ] `validData` par défaut (cas nominal)
- [ ] `buildData(overrides)` pour variations
- [ ] `invalidData` pour cas d'erreur
- [ ] `buildCommand(data, overrides)` pour handlers
- [ ] Factory functions pour value objects
- [ ] Constantes importées de `test-utils`
- [ ] Types explicites sur les overrides
