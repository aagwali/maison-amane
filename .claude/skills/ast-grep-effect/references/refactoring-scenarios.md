# Scénarios de Refactoring avec ast-grep

Ce fichier contient des scénarios réalistes de refactoring Effect-TS avec ast-grep, basés sur ce codebase DDD/Hexagonal.

---

## Scénario 1: Renommer un Aggregate à Travers Toutes les Couches

### Contexte

Vous voulez renommer `PilotProduct` en `PilotProductAggregate` pour plus de clarté. Ce changement impacte:

- Domain: Schema definition, type, constructor
- Application: Handlers, commands, validation
- Infrastructure: Repositories, mappers
- Tests: Mocks, fixtures

### Étapes

#### Étape 1.1: Identifier tous les fichiers impactés

```bash
# Backup d'abord
git stash push -m "before renaming PilotProduct"

# Trouver tous les fichiers avec PilotProduct
ast-grep --pattern 'PilotProduct' apps/server/src --json | \
  jq -r '.[].file' | sort | uniq
```

#### Étape 1.2: Renommer le Schema definition (Domain)

```bash
ast-grep --pattern 'S.TaggedStruct("PilotProduct", { $$$ })' \
         -r 'S.TaggedStruct("PilotProductAggregate", { $$$ })' \
         --interactive \
         apps/server/src/domain/pilot/aggregate.ts
```

**Avant:**

```typescript
const PilotProductSchema = S.TaggedStruct('PilotProduct', {
  id: ProductIdSchema,
  // ...
})
```

**Après:**

```typescript
const PilotProductSchema = S.TaggedStruct('PilotProductAggregate', {
  id: ProductIdSchema,
  // ...
})
```

**Note:** Le nom du schema `PilotProductSchema` ne change pas, juste le tag.

#### Étape 1.3: Renommer le Constructor

```bash
# Option 1: Si constructor est sur une ligne
ast-grep --pattern 'export const MakePilotProduct = ($$$)' \
         -r 'export const MakePilotProductAggregate = ($$$)' \
         --interactive \
         apps/server/src/domain/pilot/aggregate.ts

# Option 2: Si multiline, manual edit requis
```

**Alternative manuelle:** Utiliser l'éditeur avec Find/Replace sur `MakePilotProduct`.

#### Étape 1.4: Renommer usages du Constructor

```bash
ast-grep --pattern 'MakePilotProduct($$$)' \
         -r 'MakePilotProductAggregate($$$)' \
         --interactive \
         apps/server/src
```

Cela change tous les appels dans handlers, tests, fixtures.

#### Étape 1.5: Validation

```bash
# TypeScript check
pnpm typecheck

# Tests
pnpm test

# Si OK
git add .
git commit -m "refactor(domain): rename PilotProduct to PilotProductAggregate"

# Si problème
git stash pop
```

### Résultat

- ✅ Domain: `_tag` changé de `"PilotProduct"` à `"PilotProductAggregate"`
- ✅ Usages: Tous les `MakePilotProduct(...)` → `MakePilotProductAggregate(...)`
- ✅ Type-safe: TypeScript garantit qu'on n'a rien oublié
- ⚠️ Manuelle: Renommer `PilotProductSchema` variable si souhaité (TypeScript le détecte)

### Temps estimé

- Manual: 30-60 minutes (risque d'oublis)
- ast-grep: 5-10 minutes (automation + validation)

---

## Scénario 2: Ajouter une Méthode à un Repository Port + Implémentation

### Contexte

Vous voulez ajouter `findByLabel(label: ProductLabel): Effect.Effect<Option.Option<PilotProduct>, PersistenceError>` au `PilotProductRepository`.

### Étapes

#### Étape 2.1: Identifier le port et ses implémentations

```bash
# Trouver le port
ast-grep --pattern 'export class PilotProductRepository extends Context.Tag' \
         apps/server/src/ports

# Output:
# apps/server/src/ports/driven/repositories/pilot-product.repository.ts:26
```

```bash
# Trouver les implémentations Layer
ast-grep --pattern 'Layer.effect(PilotProductRepository, $$$)' \
         apps/server/src/infrastructure

# Output:
# apps/server/src/infrastructure/persistence/mongodb/pilot-product.repository.ts:41
```

#### Étape 2.2: Édition manuelle (ast-grep pour identification uniquement)

**Port (interface):**
`apps/server/src/ports/driven/repositories/pilot-product.repository.ts`

Ajouter:

```typescript
export interface PilotProductRepositoryService {
  readonly save: (product: PilotProduct) => Effect.Effect<PilotProduct, PersistenceError>
  readonly findById: (id: ProductId) => Effect.Effect<Option.Option<PilotProduct>, PersistenceError>
  // Nouvelle méthode
  readonly findByLabel: (
    label: ProductLabel
  ) => Effect.Effect<Option.Option<PilotProduct>, PersistenceError>
  readonly update: (product: PilotProduct) => Effect.Effect<PilotProduct, PersistenceError>
}
```

**Implementation:**
`apps/server/src/infrastructure/persistence/mongodb/pilot-product.repository.ts`

Ajouter dans factory:

```typescript
const findByLabel = (
  label: ProductLabel
): Effect.Effect<Option.Option<PilotProduct>, PersistenceError> =>
  Effect.gen(function* () {
    const collection = yield* getCollection(db)
    const doc = yield* Effect.tryPromise({
      try: () => collection.findOne({ label }),
      catch: (error) => new PersistenceError({ cause: error as Error }),
    })
    return doc ? Option.some(toDomain(doc)) : Option.none()
  })

// Dans return
return {
  save,
  findById,
  findByLabel, // Ajouter
  update,
}
```

#### Étape 2.3: Vérifier usages (si méthode existait)

Si vous remplacez/renommez une méthode existante:

```bash
# Trouver tous les usages
ast-grep --pattern 'yield* repo.oldMethodName($$$)' apps/server/src/application
```

#### Étape 2.4: Validation

```bash
pnpm typecheck  # TypeScript garantit que tous les ports implémentent la méthode
pnpm test
```

### Résultat

- ✅ Port: Nouvelle méthode dans l'interface
- ✅ Implementation: Logique MongoDB ajoutée
- ✅ Type-safe: Impossible d'oublier une implémentation (TypeScript error)

### Leçon

ast-grep est utile pour **identifier** les fichiers, mais l'**ajout** de code nouveau est manuel. Combiner ast-grep (find) + Edit tool (modify).

---

## Scénario 3: Migrer Pattern de Validation (S.filter → S.transformOrFail)

### Contexte

`S.filter` produit des messages d'erreur peu clairs. Vous voulez migrer vers `S.transformOrFail` pour meilleurs messages.

### Étapes

#### Étape 3.1: Identifier tous les S.filter

```bash
ast-grep --pattern 'S.filter($$$)' apps/server/src/application/**/validation
```

**Output:**

```
apps/server/src/application/pilot/validation/product-data.schema.ts:47
apps/server/src/application/pilot/validation/variant-input.schema.ts:22
```

#### Étape 3.2: Analyser chaque usage

Lire les fichiers identifiés pour comprendre la logique de chaque filter.

**Exemple - Avant:**

```typescript
const PositivePriceSchema = S.Number.pipe(
  S.filter((n) => n > 0, {
    message: () => 'Price must be positive',
  })
)
```

#### Étape 3.3: Migration manuelle

**Après:**

```typescript
const PositivePriceSchema = S.Number.pipe(
  S.transformOrFail(S.Number, {
    strict: true,
    decode: (n) =>
      n > 0
        ? Effect.succeed(n)
        : Effect.fail(new ParseError({ message: `Price must be positive, got ${n}` })),
    encode: (n) => Effect.succeed(n),
  })
)
```

#### Étape 3.4: Alternative - S.positive() built-in

Pour ce cas spécifique, utiliser le built-in:

```typescript
const PositivePriceSchema = S.Number.pipe(S.positive())
```

**Leçon:** Avant de migrer, vérifier si Effect Schema a déjà un combinator.

#### Étape 3.5: Validation

```bash
pnpm test  # Vérifier que validation produit les mêmes résultats
```

### Résultat

- ✅ Meilleurs messages d'erreur (incluent valeur reçue)
- ✅ Plus explicite (decode/encode)
- ⚠️ Migration manuelle (logique custom)

---

## Scénario 4: Auditer Tous les Points d'Émission d'Événements

### Contexte

Vous voulez documenter tous les endroits où des événements domain sont publiés pour audit de cohérence.

### Étapes

#### Étape 4.1: Trouver tous les events domain

```bash
ast-grep --pattern 'S.TaggedStruct($NAME, { $$$ })' \
         apps/server/src/domain/**/events.ts --json | \
  jq -r '.[].matches[].metaVariables.NAME.value'
```

**Output:**

```
"PilotProductPublished"
"PilotProductSynced"
"PilotProductDeleted"
```

#### Étape 4.2: Pour chaque event, trouver les publishers

```bash
ast-grep --pattern 'MakePilotProductPublished($$$)' apps/server/src
```

**Output:**

```
apps/server/src/application/pilot/handlers/create-pilot-product.handler.ts:78
apps/server/src/application/pilot/handlers/update-pilot-product.handler.ts:92
```

#### Étape 4.3: Vérifier pattern EventPublisher

```bash
ast-grep --pattern 'yield* eventPublisher.publish($$$)' apps/server/src/application
```

ou

```bash
ast-grep --pattern 'yield* EventPublisher' apps/server/src/application
```

#### Étape 4.4: Générer rapport

Combiner les résultats:

```bash
# Script bash pour générer rapport
for event in PilotProductPublished PilotProductSynced PilotProductDeleted; do
  echo "Event: $event"
  ast-grep --pattern "Make$event(\$\$\$)" apps/server/src --json | \
    jq -r '.[].file' | sort | uniq
  echo ""
done
```

### Résultat

- ✅ Liste exhaustive des events
- ✅ Localisation précise des publishers
- ✅ Audit rapide (vs manual grep)

### Cas d'usage

- Documentation architecture
- Impact analysis (suppression d'un event)
- Vérifier cohérence (tous les events ont-ils un publisher?)

---

## Scénario 5: Vérifier Cohérence des Layers (Port → Implementation)

### Contexte

Vous voulez vérifier que chaque `Context.Tag` (port) a une implémentation `Layer.effect`.

### Étapes

#### Étape 5.1: Lister tous les ports

```bash
ast-grep --pattern 'export class $CLASS extends Context.Tag($TAG)' \
         apps/server/src/ports --json | \
  jq -r '.[].matches[].metaVariables.CLASS.value' > /tmp/ports.txt
```

**Output `/tmp/ports.txt`:**

```
PilotProductRepository
CatalogProductRepository
EventPublisher
IdGenerator
Clock
```

#### Étape 5.2: Lister toutes les implémentations Layer

```bash
ast-grep --pattern 'Layer.effect($TAG, $$$)' \
         apps/server/src/infrastructure --json | \
  jq -r '.[].matches[].metaVariables.TAG.value' > /tmp/layers.txt
```

**Output `/tmp/layers.txt`:**

```
PilotProductRepository
CatalogProductRepository
EventPublisher
IdGenerator
Clock
```

#### Étape 5.3: Comparer (diff)

```bash
# Ports sans implémentation
comm -23 <(sort /tmp/ports.txt) <(sort /tmp/layers.txt)

# Implémentations sans port (orphelins)
comm -13 <(sort /tmp/ports.txt) <(sort /tmp/layers.txt)
```

Si output vide: ✅ Cohérence parfaite.

#### Étape 5.4: Alternative - Script automatisé

```bash
#!/bin/bash
# check-layer-consistency.sh

PORTS=$(ast-grep --pattern 'export class $CLASS extends Context.Tag' apps/server/src/ports --json | \
  jq -r '.[].matches[].metaVariables.CLASS.value' | sort)

LAYERS=$(ast-grep --pattern 'Layer.effect($TAG, $$$)' apps/server/src/infrastructure --json | \
  jq -r '.[].matches[].metaVariables.TAG.value' | sort)

echo "Ports without Layer implementation:"
comm -23 <(echo "$PORTS") <(echo "$LAYERS")

echo ""
echo "Layers without Port definition:"
comm -13 <(echo "$PORTS") <(echo "$LAYERS")
```

### Résultat

- ✅ Audit architectural automatisé
- ✅ Détecte incohérences (port sans impl, impl sans port)
- ✅ Intégrable en CI/CD

---

## Scénario 6: Trouver Handlers Sans Error Handling

### Contexte

Vous voulez identifier les handlers qui ne catchent pas les erreurs (risque de crash).

### Étapes

#### Étape 6.1: Trouver tous les handlers

```bash
ast-grep --pattern 'export const handle$NAME = ($$$): Effect.Effect<$$$> =>' \
         apps/server/src/application/**/*.handler.ts
```

#### Étape 6.2: Pour chaque handler, chercher mapError ou catchAll

```bash
# Chercher mapError
ast-grep --pattern 'Effect.mapError($$$)' apps/server/src/application/**/*.handler.ts

# Chercher catchAll
ast-grep --pattern 'Effect.catchAll($$$)' apps/server/src/application/**/*.handler.ts
```

#### Étape 6.3: Comparer

Handlers listés en 6.1 - handlers avec error handling = handlers à risque.

### Résultat

- ✅ Identification des handlers fragiles
- ✅ Candidats pour ajouter error handling
- ⚠️ Faux positifs: erreurs gérées par caller

---

## Scénario 7: Refactorer Imports (Alias Inconsistency)

### Contexte

Certains fichiers importent `import * as Schema from 'effect/Schema'`, d'autres `import * as S from 'effect/Schema'`. Vous voulez uniformiser.

### Étapes

#### Étape 7.1: Trouver imports inconsistants

```bash
# Imports avec alias Schema
ast-grep --pattern "import * as Schema from 'effect/Schema'" apps/server/src

# Imports avec alias S
ast-grep --pattern "import * as S from 'effect/Schema'" apps/server/src
```

#### Étape 7.2: Décider standard (ex: S)

#### Étape 7.3: Rewrite imports

```bash
ast-grep --pattern "import * as Schema from 'effect/Schema'" \
         -r "import * as S from 'effect/Schema'" \
         --interactive \
         apps/server/src
```

#### Étape 7.4: Rewrite usages

**Problème:** `Schema.String` → `S.String` partout dans le fichier.

**Solution:** Multi-étapes ou sed/perl.

```bash
# Pour chaque fichier avec Schema, remplacer Schema. par S.
for file in $(ast-grep --pattern "import * as Schema from 'effect/Schema'" apps/server/src --json | jq -r '.[].file'); do
  sed -i '' 's/Schema\./S\./g' "$file"
done
```

**⚠️ Attention:** Peut casser si variable nommée `Schema` ailleurs.

#### Étape 7.5: Validation

```bash
pnpm typecheck
pnpm test
```

### Résultat

- ✅ Cohérence des imports
- ⚠️ Combine ast-grep + sed/perl (ast-grep seul insuffisant)

---

## Récapitulatif des Scénarios

| #   | Scénario             | ast-grep Role       | Manual Role    | Temps Gagné |
| --- | -------------------- | ------------------- | -------------- | ----------- |
| 1   | Renommer aggregate   | Recherche + Rewrite | Validation     | 80%         |
| 2   | Ajouter méthode repo | Identification      | Implémentation | 30%         |
| 3   | Migrer validation    | Identification      | Migration      | 20%         |
| 4   | Auditer events       | Recherche           | Analyse        | 90%         |
| 5   | Cohérence layers     | Audit complet       | -              | 95%         |
| 6   | Handlers sans errors | Identification      | Fix            | 50%         |
| 7   | Refactor imports     | Recherche           | sed/perl combo | 60%         |

**Leçon générale:**

- ast-grep excellent pour **recherche structurelle** et **refactoring simple**
- Moins bon pour **ajout de code nouveau** (logique custom)
- Combine ast-grep (find) + Edit/Write (modify) pour meilleurs résultats

---

## Bonnes Pratiques

### 1. Toujours faire un backup

```bash
git stash push -m "before ast-grep refactor"
```

### 2. Tester sur un fichier avant tout le codebase

```bash
ast-grep --pattern 'OLD' -r 'NEW' apps/server/src/domain/pilot/aggregate.ts
# Vérifier
git diff
# Si OK, étendre
ast-grep --pattern 'OLD' -r 'NEW' apps/server/src
```

### 3. Utiliser --interactive pour changements risqués

```bash
ast-grep --pattern 'OLD' -r 'NEW' --interactive apps/server/src
```

### 4. Combiner avec TypeScript

```bash
ast-grep --pattern 'OLD' -r 'NEW' apps/server/src
pnpm typecheck  # TypeScript détecte oublis
```

### 5. Exporter en JSON pour scripting

```bash
ast-grep --pattern 'PATTERN' apps/server/src --json | jq '...'
```
