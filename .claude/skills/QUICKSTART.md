# Quick Start Guide - Skills DDD

Guide de démarrage rapide pour utiliser les nouveaux skills.

## 🚀 Workflow recommandé

### 1️⃣ Créer un nouveau bounded context

```bash
cd /Users/aagwali/workspace/personnel/maison-amane

# Scaffolder la structure complète
python .claude/skills/ddd-feature-complete/scripts/scaffold_bounded_context.py shipping
```

**Ce que fait le script** :

- ✅ Crée `domain/shipping/` avec aggregate, value-objects, events, errors
- ✅ Crée `application/shipping/` avec commands, handlers, validation
- ✅ Crée le port repository dans `ports/driven/repositories/`
- ✅ Crée l'implémentation MongoDB + mapper
- ✅ Crée l'implémentation in-memory pour tests
- ✅ Crée le fichier de test du handler

**Résultat** : 15+ fichiers créés en 5 secondes ⚡

### 2️⃣ Personnaliser le domaine

Ouvrir [domain/shipping/aggregate.ts](../../apps/server/src/domain/shipping/aggregate.ts) et définir les propriétés :

```typescript
const ShippingSchema = S.TaggedStruct('Shipping', {
  id: ShippingIdSchema,
  orderId: OrderIdSchema, // ← Ajouter
  trackingNumber: TrackingNumberSchema, // ← Ajouter
  status: ShippingStatusSchema, // ← Ajouter
  carrier: CarrierSchema, // ← Ajouter
  estimatedDelivery: S.Date, // ← Ajouter
  createdAt: S.Date,
  updatedAt: S.Date,
})
```

**Besoin d'aide ?** → Invoquer le skill **domain-modeling**

### 3️⃣ Implémenter le handler

Ouvrir [application/shipping/handlers/create-shipping.handler.ts](../../apps/server/src/application/shipping/handlers/create-shipping.handler.ts) et compléter la logique :

```typescript
export const handleCreateShipping = (command: CreateShippingCommand) =>
  Effect.gen(function* () {
    const repo = yield* ShippingRepository
    const idGen = yield* IdGenerator
    const clock = yield* Clock

    // 1. Générer ID
    const id = yield* idGen.generateShippingId()
    const now = yield* clock.now()

    // 2. Créer aggregate
    const shipping = MakeShipping({
      id,
      orderId: command.data.orderId, // ← Mapper les champs
      trackingNumber: command.data.trackingNumber,
      status: ShippingStatus.PENDING,
      carrier: command.data.carrier,
      estimatedDelivery: command.data.estimatedDelivery,
      createdAt: now,
      updatedAt: now,
    })

    // 3. Persister
    return yield* repo.save(shipping)
  })
```

**Besoin d'aide ?** → Invoquer le skill **application-use-cases**

### 4️⃣ Compléter le mapper

Ouvrir [infrastructure/persistence/mongodb/mappers/shipping.mapper.ts](../../apps/server/src/infrastructure/persistence/mongodb/mappers/shipping.mapper.ts) :

```typescript
export interface ShippingDocument {
  _id: string
  orderId: string // ← Ajouter
  trackingNumber: string // ← Ajouter
  status: string // ← Ajouter
  carrier: string // ← Ajouter
  estimatedDelivery: Date // ← Ajouter
  createdAt: Date
  updatedAt: Date
}

export const shippingToDocument = (shipping: Shipping): ShippingDocument => ({
  _id: shipping.id,
  orderId: shipping.orderId, // ← Mapper
  trackingNumber: shipping.trackingNumber, // ← Mapper
  status: shipping.status, // ← Mapper
  carrier: shipping.carrier, // ← Mapper
  estimatedDelivery: shipping.estimatedDelivery, // ← Mapper
  createdAt: shipping.createdAt,
  updatedAt: shipping.updatedAt,
})
```

**Besoin d'aide ?** → Invoquer le skill **infrastructure-adapters**

### 5️⃣ Wiring (intégration)

#### a) Exporter le repository

[ports/driven/index.ts](../../apps/server/src/ports/driven/index.ts) :

```typescript
export * from './repositories/shipping.repository'
```

#### b) Ajouter au layer de composition

[composition/layers/development.layer.ts](../../apps/server/src/composition/layers/development.layer.ts) :

```typescript
import { MongodbShippingRepositoryLive } from '../../infrastructure/persistence/mongodb'

const ShippingLayer = MongodbShippingRepositoryLive.pipe(Layer.provide(MongoDatabaseLive))

export const DevelopmentLayer = Layer.mergeAll(
  // ... autres layers
  ShippingLayer
)
```

#### c) Créer le HTTP handler (si API nécessaire)

```bash
# Générer un handler HTTP (à faire manuellement pour l'instant)
# TODO: Script à créer
```

### 6️⃣ Tests

Ouvrir [application/shipping/handlers/create-shipping.handler.test.ts](../../apps/server/src/application/shipping/handlers/create-shipping.handler.test.ts) et compléter :

```typescript
describe('handleCreateShipping', () => {
  let testCtx: TestContext

  beforeEach(() => {
    testCtx = provideTestLayer()
  })

  it('creates a shipping with deterministic ID', async () => {
    const command = MakeCreateShippingCommand({
      data: {
        orderId: 'order-123',
        trackingNumber: 'TRACK-456',
        carrier: 'UPS',
        estimatedDelivery: new Date('2026-02-10'),
      },
      correlationId: 'test-correlation' as any,
      userId: 'test-user' as any,
      timestamp: TEST_DATE,
    })

    const result = await Effect.runPromise(
      handleCreateShipping(command).pipe(Effect.provide(testCtx.layer))
    )

    expect(result.id).toBe('test-shipping-1')
    expect(result.orderId).toBe('order-123')
  })
})
```

**Besoin d'aide ?** → Invoquer le skill **testing-effect**

### 7️⃣ Lancer les tests

```bash
cd apps/server
pnpm test application/shipping/handlers/create-shipping.handler.test.ts
```

## 🎯 Workflows rapides

### Ajouter une entité à un contexte existant

```bash
python .claude/skills/ddd-feature-complete/scripts/generate_repository.py Invoice order
```

### Ajouter un handler (command)

```bash
python .claude/skills/ddd-feature-complete/scripts/generate_handler.py ship Order order --type=command
```

### Ajouter une query

```bash
python .claude/skills/ddd-feature-complete/scripts/generate_handler.py list Shipping shipping --type=query
```

## 📚 Invoquer les skills

Dans Claude Code :

```
# Skill principal (orchestrateur)
/ddd-feature-complete

# Skills de référence
/domain-modeling
/application-use-cases
/infrastructure-adapters
/testing-effect
```

## 🆘 Besoin d'aide ?

### Problème : "Je ne sais pas quel pattern utiliser pour mon value object"

→ Invoquer `/domain-modeling` et consulter l'arbre de décision

### Problème : "Comment faire une validation conditionnelle ?"

→ Invoquer `/application-use-cases` → voir [validation-schemas.md](application-use-cases/references/validation-schemas.md)

### Problème : "Comment mapper mon aggregate vers MongoDB ?"

→ Invoquer `/infrastructure-adapters` → voir [mongodb/mapper.md](infrastructure-adapters/references/mongodb/mapper.md)

### Problème : "Comment tester mon handler ?"

→ Invoquer `/testing-effect` → voir [integration-testing.md](testing-effect/references/integration-testing.md)

## ✅ Checklist de feature complète

Avant de considérer une feature terminée :

- [ ] Aggregate défini avec `S.TaggedStruct` + `Data.case`
- [ ] Value objects avec branded types pour IDs
- [ ] Events définis avec correlationId/userId/timestamp
- [ ] Erreurs typées avec `Data.TaggedError`
- [ ] Command handler implémenté avec signature Effect complète
- [ ] Repository : port + MongoDB + in-memory
- [ ] Mapper : toDocument + fromDocument
- [ ] Tests : handler test avec TestLayer
- [ ] Wiring : exports + layer + HTTP (si nécessaire)
- [ ] Tests passent : `pnpm test`

## 🎓 Conventions importantes

| Convention   | Exemple                         | ❌ Incorrect        |
| ------------ | ------------------------------- | ------------------- |
| Context name | `shipping`, `order`             | `Shipping`, `ORDER` |
| Aggregate    | `Shipping`, `Order`             | `shipping`, `order` |
| Command      | `CreateShippingCommand`         | `CreateCommand`     |
| Handler      | `handleCreateShipping`          | `createShipping`    |
| Event        | `ShippingCreated`               | `CreateShipping`    |
| Repository   | `ShippingRepository`            | `ShippingRepo`      |
| Layer        | `MongodbShippingRepositoryLive` | `ShippingLayer`     |

## 🚨 Erreurs courantes

### ❌ Oublier d'exporter dans index.ts

```typescript
// domain/shipping/index.ts
export * from './aggregate'
export * from './value-objects'
export * from './events'
export * from './errors'
```

### ❌ Ne pas ajouter le layer à la composition

Sans ça, DI échoue avec "Service not found"

### ❌ Mapper incomplet (oublier des champs)

Résultat : `undefined` dans l'aggregate après fetch DB

### ❌ Tests sans TestLayer

Résultat : "Service not found" errors

## 📖 Documentation complète

- [README.md](README.md) - Vue d'ensemble des skills
- [ddd-feature-complete/skill.md](ddd-feature-complete/skill.md) - Orchestrateur principal

---

**Prêt à développer ! 🚀**
