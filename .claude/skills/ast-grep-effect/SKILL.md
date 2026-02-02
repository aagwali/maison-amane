---
name: ast-grep-effect
description: |
  Recherche et refactorisation de patterns Effect-TS avec ast-grep dans ce codebase DDD/Hexagonal.
  Utiliser quand: (1) Refactoring à grande échelle de patterns Effect (Schema, Context.Tag, Effect.gen, Layer),
  (2) Recherche de tous les usages d'un pattern spécifique (TaggedStruct, Data.case, yield*),
  (3) Migration de patterns Effect (renommer schemas, changer signatures Context.Tag),
  (4) Analyse de la cohérence architecturale (trouver tous les aggregates, handlers, repositories).

  Couvre: S.TaggedStruct, S.brand, S.Union, Data.case, Context.Tag, Effect.gen/yield*, Layer.effect, validation schemas.
---

# ast-grep pour Effect-TS

## Introduction

### Qu'est-ce qu'ast-grep?

ast-grep est un outil de recherche **structurelle** de code basé sur l'Abstract Syntax Tree (AST), pas sur des regex textuelles. Il comprend la structure syntaxique du code TypeScript et permet de matcher des patterns complexes de manière fiable.

### Pourquoi pour Effect-TS?

Les patterns Effect-TS sont difficiles à rechercher avec grep classique:

- `S.TaggedStruct` avec propriétés imbriquées
- `Effect.gen` avec yield\* sur plusieurs lignes
- `Context.Tag` avec génériques complexes
- `Layer` compositions multi-niveaux

ast-grep résout ces problèmes en matchant la structure AST, pas le texte.

### Quand utiliser ce skill?

Utiliser ast-grep quand:

- **Refactoring multi-fichiers** - Renommer un schema/tag/handler à travers tout le codebase
- **Migrations de patterns** - Changer tous les `S.brand` pour ajouter une validation
- **Audit architectural** - Trouver tous les aggregates sans events, tous les handlers sans tests
- **Recherche complexe** - Trouver tous les `Effect.gen` qui yield\* un service spécifique

### Quand NE PAS utiliser ast-grep?

Ne pas utiliser pour:

- **Recherche simple de string** - Utiliser `Grep` (plus rapide)
- **1-2 fichiers seulement** - Utiliser `Read` + navigation manuelle
- **Patterns déjà couverts par TypeScript** - Le compilateur détecte les erreurs de type

### Vérification installation

ast-grep est déjà installé (v0.40.5):

```bash
ast-grep --version
```

---

## Workflow Rapide

### Étape 1: Identifier le pattern

**Exemple concret:** Renommer `PilotProduct` en `PilotProductAggregate` partout dans le codebase.

**Fichiers affectés:**

- Schema definition: `S.TaggedStruct("PilotProduct", { ... })`
- Type extraction: `typeof PilotProductSchema.Type`
- Constructor: `MakePilotProduct`
- Imports et usages dans handlers, repositories, tests

**Pattern à chercher:** `S.TaggedStruct("PilotProduct", { $$$ })`

### Étape 2: Construire la query iterativement

Commencer simple, tester, raffiner:

```bash
# Test 1: Trouver juste le nom
ast-grep --pattern 'PilotProduct' apps/server/src

# Test 2: Trouver la définition du schema
ast-grep --pattern 'S.TaggedStruct("PilotProduct", { $$$ })' apps/server/src

# Test 3: Scope au domain layer uniquement
ast-grep --pattern 'S.TaggedStruct("PilotProduct", { $$$ })' \
         apps/server/src/domain/pilot/aggregate.ts
```

**Métavariables:**

- `$NAME` - Capture un identifiant (variable, fonction, type)
- `$$` - Capture une expression
- `$$$` - Capture plusieurs éléments (props, args, statements)

### Étape 3: Valider les matches

Vérifier que l'output correspond aux attentes:

```bash
ast-grep --pattern 'S.TaggedStruct($NAME, { $$$ })' \
         apps/server/src/domain/pilot/aggregate.ts
```

**Output attendu:**

```
apps/server/src/domain/pilot/aggregate.ts
71:const PilotProductSchema = S.TaggedStruct("PilotProduct", {
```

Si trop de matches ou pas assez, ajuster le pattern.

### Étape 4: Rewrite (si besoin)

Une fois le pattern validé, utiliser `-r` pour remplacer:

```bash
# Backup d'abord!
git stash push -m "before ast-grep refactor"

# Rewrite avec confirmation interactive
ast-grep --pattern 'S.TaggedStruct("PilotProduct", { $$$ })' \
         -r 'S.TaggedStruct("PilotProductAggregate", { $$$ })' \
         --interactive \
         apps/server/src/domain/pilot/aggregate.ts
```

Le flag `--interactive` demande confirmation pour chaque changement.

### Étape 5: Appliquer et valider

Après les changements:

```bash
# Vérifier les changements
git diff

# Valider TypeScript
pnpm typecheck

# Lancer les tests
pnpm test

# Si tout est OK, commit
git add .
git commit -m "refactor(domain): rename PilotProduct to PilotProductAggregate"

# Si problème, rollback
git stash pop
```

---

## Patterns Courants par Couche

### Domain Layer

#### Trouver tous les aggregates (TaggedStruct)

```bash
ast-grep --pattern 'S.TaggedStruct($NAME, { $$$ })' \
         apps/server/src/domain/**/*.ts
```

**Use case:** Lister tous les aggregates pour audit architectural.

#### Trouver tous les branded IDs

```bash
ast-grep --pattern 'S.String.pipe(S.brand($BRAND))' \
         apps/server/src/domain/**/ids.ts
```

**Use case:** Vérifier que tous les IDs utilisent des branded types.

#### Trouver toutes les unions discriminées

```bash
ast-grep --pattern 'S.Union($$$)' \
         apps/server/src/domain/**/*.ts
```

**Use case:** Identifier les state machines et variantes.

#### Trouver constructeurs Data.case

```bash
ast-grep --pattern 'Data.case<$TYPE>()({ _tag: $TAG, $$$ })' \
         apps/server/src/domain
```

**Use case:** Trouver tous les constructeurs immuables pour vérifier la cohérence.

#### Trouver domain errors (TaggedError)

```bash
ast-grep --pattern 'Data.TaggedError($TAG)' \
         apps/server/src/domain/**/errors.ts
```

**Use case:** Lister toutes les erreurs du domain pour documentation.

### Application Layer

#### Trouver tous les handlers Effect.gen

```bash
ast-grep --pattern 'Effect.gen(function* () { $$$ })' \
         apps/server/src/application/**/*.handler.ts
```

**Use case:** Lister tous les handlers pour analyse des dépendances.

#### Trouver tous les yield\* (dependencies)

```bash
ast-grep --pattern 'yield* $SERVICE' \
         apps/server/src/application
```

**Use case:** Identifier quels services sont utilisés par les handlers.

#### Trouver validation schemas (transformOrFail)

```bash
ast-grep --pattern 'S.transformOrFail($$$)' \
         apps/server/src/application/**/validation
```

**Use case:** Auditer les transformations avec logique métier.

#### Trouver validation schemas (filter)

```bash
ast-grep --pattern 'S.filter($$$)' \
         apps/server/src/application/**/validation
```

**Use case:** Identifier les validations par prédicat.

#### Trouver command DTOs

```bash
ast-grep --pattern 'S.TaggedStruct($NAME, { $$$ })' \
         apps/server/src/application/**/commands
```

**Use case:** Lister toutes les commandes CQRS.

### Ports Layer

#### Trouver tous les Context.Tag (ports)

```bash
ast-grep --pattern 'export class $CLASS extends Context.Tag($TAG)<$T, $S>() {}' \
         apps/server/src/ports
```

**Use case:** Lister tous les ports pour vérifier qu'ils ont une implémentation.

**Note:** Le pattern peut nécessiter ajustement si la définition s'étend sur plusieurs lignes.

#### Trouver repository interfaces

```bash
ast-grep --pattern 'Effect.Effect<$RETURN, $ERROR>' \
         apps/server/src/ports/**/repositories
```

**Use case:** Identifier les signatures des méthodes repository.

#### Trouver service interfaces

```bash
ast-grep --pattern 'export interface $NAME { $$$ }' \
         apps/server/src/ports/**/services
```

**Use case:** Lister toutes les interfaces de services.

### Infrastructure Layer

#### Trouver Layer.effect (implémentations)

```bash
ast-grep --pattern 'Layer.effect($TAG, $IMPL)' \
         apps/server/src/infrastructure
```

**Use case:** Vérifier que chaque port a une implémentation Layer.

#### Trouver Layer.mergeAll (compositions)

```bash
ast-grep --pattern 'Layer.mergeAll($$$)' \
         apps/server/src/composition
```

**Use case:** Identifier les layers composés pour DevelopmentLayer, ProductionLayer.

#### Trouver Layer.provide (wiring)

```bash
ast-grep --pattern 'Layer.provide($$$)' \
         apps/server/src
```

**Use case:** Tracer comment les layers sont fournis aux Effect.

#### Trouver repository implementations

```bash
ast-grep --pattern 'export const create$NAME = ($$$): $TYPE => ({ $$$ })' \
         apps/server/src/infrastructure/persistence
```

**Use case:** Lister toutes les implémentations de repositories.

### Composition Layer

#### Trouver DevelopmentLayer

```bash
ast-grep --pattern 'export const DevelopmentLayer = $$$' \
         apps/server/src/composition/layers/development.layer.ts
```

**Use case:** Vérifier la composition du layer de développement.

#### Trouver ProductionLayer

```bash
ast-grep --pattern 'export const ProductionLayer = $$$' \
         apps/server/src/composition/layers/production.layer.ts
```

**Use case:** Auditer les différences dev vs prod.

---

## Référence Rapide

### Metavariables

| Metavariable | Signification                                        | Exemple d'usage        |
| ------------ | ---------------------------------------------------- | ---------------------- |
| `$NAME`      | Capture un identifiant (variable, fonction, type)    | `function $NAME() {}`  |
| `$$`         | Capture une expression                               | `const x = $$`         |
| `$$$`        | Capture plusieurs éléments (props, args, statements) | `{ $$$ }` ou `fn($$$)` |

### Flags ast-grep

| Flag                  | Description                  | Exemple                                |
| --------------------- | ---------------------------- | -------------------------------------- |
| `--pattern 'PATTERN'` | Pattern AST à rechercher     | `--pattern 'Effect.gen($$$)'`          |
| `-r 'REPLACEMENT'`    | Rewrite pattern              | `-r 'Effect.gen(function*() { $$$ })'` |
| `--json`              | Output JSON (pour scripts)   | `--json \| jq`                         |
| `--interactive`       | Confirmer chaque changement  | Recommandé pour refactoring            |
| `--debug-query`       | Debugger le pattern matching | Utile si pattern ne matche pas         |
| `--count`             | Compter les matches          | Pour statistiques                      |

### Scopes typiques

```bash
# Domain uniquement
apps/server/src/domain

# Application uniquement
apps/server/src/application

# Tous les handlers
apps/server/src/**/*.handler.ts

# Tous les repositories
apps/server/src/**/repositories

# Tout le server
apps/server/src

# Exclure node_modules et tests
apps/server/src --ignore-dirs node_modules,tests
```

### Exemples de patterns complets

**Renommer un aggregate:**

```bash
ast-grep --pattern 'S.TaggedStruct("OldName", { $$$ })' \
         -r 'S.TaggedStruct("NewName", { $$$ })' \
         --interactive \
         apps/server/src
```

**Trouver usages d'un service:**

```bash
ast-grep --pattern 'yield* PilotProductRepository' \
         apps/server/src/application
```

**Lister tous les events:**

```bash
ast-grep --pattern 'S.TaggedStruct($NAME, { $$$ })' \
         apps/server/src/domain/**/events.ts
```

---

## Pour Aller Plus Loin

### Patterns exhaustifs

Voir [references/effect-patterns.md](references/effect-patterns.md) pour une liste exhaustive de tous les patterns Effect-TS avec queries ast-grep correspondantes.

Contenu:

- Patterns Domain (aggregates, VOs, events, errors)
- Patterns Application (handlers, commands, validation)
- Patterns Ports (Context.Tag, interfaces)
- Patterns Infrastructure (Layer, repositories)
- Patterns Composition (layers composés)

### Scénarios de refactoring

Voir [references/refactoring-scenarios.md](references/refactoring-scenarios.md) pour des scénarios réalistes de refactoring avec ast-grep.

Scénarios:

1. Renommer un aggregate à travers toutes les couches
2. Ajouter une méthode à un repository port + implémentation
3. Migrer un pattern de validation (S.filter → S.transformOrFail)
4. Auditer tous les points d'émission d'événements
5. Vérifier cohérence des layers (port → implémentation)

### Guide complet ast-grep

Voir [references/ast-grep-guide.md](references/ast-grep-guide.md) pour un guide approfondi sur ast-grep appliqué à Effect-TS.

Contenu:

- Fondamentaux AST vs Regex
- Syntaxe des patterns avec exemples TypeScript
- Rewrite patterns avancés
- Output formats (JSON, stats)
- Config files (.ast-grep.yml)
- TypeScript-specific tips
- Effect-TS gotchas

---

## Intégration avec Autres Skills

Ce skill complète les skills DDD existants:

- **domain-layer-effect** - Créer des structures, puis les refactorer avec ast-grep
- **use-case-cqrs-effect** - Créer des handlers, puis analyser leurs dépendances avec ast-grep
- **bounded-context-ddd** - Créer un bounded context, puis auditer sa cohérence avec ast-grep
- **infra-adapter-hexa** - Créer des adapters, puis vérifier le wiring avec ast-grep

**Workflow typique:**

1. Créer structures avec domain-layer-effect
2. Implémenter handlers avec use-case-cqrs-effect
3. Refactorer à grande échelle avec ast-grep-effect
4. Auditer cohérence architecturale avec ast-grep-effect

---

## Tips Importants

### Toujours faire un backup

```bash
git stash push -m "before ast-grep"
```

### Utiliser --interactive pour refactoring risqués

```bash
ast-grep --pattern 'OLD' -r 'NEW' --interactive apps/server/src
```

### Tester sur un fichier avant tout le codebase

```bash
# Test sur 1 fichier
ast-grep --pattern 'PATTERN' apps/server/src/domain/pilot/aggregate.ts

# Si OK, étendre au codebase
ast-grep --pattern 'PATTERN' apps/server/src
```

### Ignorer server-java

Ce codebase contient du Java dans `apps/server-java/`. ast-grep fonctionne aussi avec Java, mais ce skill est focalisé sur TypeScript/Effect-TS.

Pour éviter les matches Java:

```bash
ast-grep --pattern 'PATTERN' apps/server/src  # Uniquement TypeScript
```

### Combiner avec jq pour post-processing

```bash
ast-grep --pattern 'S.TaggedStruct($NAME, { $$$ })' \
         --json \
         apps/server/src/domain | \
  jq -r '.[].file' | \
  sort | uniq
```

Utile pour extraire juste les noms de fichiers, compter les occurrences, etc.
