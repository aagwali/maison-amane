# Guide Complet ast-grep pour Effect-TS

Ce guide couvre les fondamentaux d'ast-grep appliqués à TypeScript et Effect-TS.

---

## AST vs Regex: Pourquoi Structurel > Texte

### Problème avec Regex

Regex cherche du texte, pas de la structure:

```typescript
// Chercher "Effect.gen" avec regex
grep "Effect.gen" apps/server/src
```

**Problèmes:**

- ❌ Matche `// Effect.gen` (commentaire)
- ❌ Matche `"Effect.gen"` (string)
- ❌ Matche `MyEffect.gen` (autre classe)
- ❌ Ne matche pas `Effect .  gen` (espaces)
- ❌ Difficile pour patterns multi-lignes

### Solution avec AST

ast-grep comprend la structure syntaxique:

```bash
ast-grep --pattern 'Effect.gen($$$)' apps/server/src
```

**Avantages:**

- ✅ Ignore commentaires et strings
- ✅ Ignore whitespace/formatting
- ✅ Comprend scope et structure
- ✅ Supporte patterns multi-lignes
- ✅ Type-aware (TypeScript AST)

---

## Syntaxe des Patterns: Les Bases

### Pattern Littéral

Cherche exactement ce texte (mais structurellement):

```bash
ast-grep --pattern 'Effect.gen' apps/server/src
```

Matche:

```typescript
Effect.gen(...)  // ✅
Effect . gen(...)  // ✅ (ignore whitespace)
Effect.gen  // ✅
```

Ne matche pas:

```typescript
'Effect.gen' // ❌ (string)
// Effect.gen  // ❌ (commentaire)
```

### Metavariables: Capture de Patterns

#### $NAME - Capture un identifiant

```bash
ast-grep --pattern 'const $NAME = Effect.gen($$$)' apps/server/src
```

Matche:

```typescript
const handleSomething = Effect.gen(...)  // $NAME = handleSomething
const myHandler = Effect.gen(...)  // $NAME = myHandler
```

**Utilisation:** Extraire des noms de variables/fonctions.

#### $$ - Capture une expression

```bash
ast-grep --pattern 'console.log($$)' apps/server/src
```

Matche:

```typescript
console.log(42) // $$ = 42
console.log(product.id) // $$ = product.id
console.log(foo.bar.baz()) // $$ = foo.bar.baz()
```

**Utilisation:** Capturer n'importe quelle expression (valeur, appel, propriété).

#### $$$ - Capture plusieurs éléments

```bash
ast-grep --pattern 'function foo($$$) {}' apps/server/src
```

Matche:

```typescript
function foo() {} // $$$ = (vide)
function foo(a) {} // $$$ = a
function foo(a, b, c) {} // $$$ = a, b, c
```

**Utilisation:** Capturer arguments, propriétés, statements, etc.

**Important:** `$$$` est **greedy** (capture autant que possible).

### Exemples avec Effect-TS

#### Trouver Schema avec propriétés

```bash
ast-grep --pattern 'S.TaggedStruct($NAME, { $$$ })' apps/server/src
```

- `$NAME` = nom du tag ("PilotProduct")
- `$$$` = toutes les propriétés (id, label, etc.)

#### Trouver Effect.gen avec body

```bash
ast-grep --pattern 'Effect.gen(function* () { $$$ })' apps/server/src
```

- `$$$` = tout le body du generator

#### Trouver yield\* d'un service

```bash
ast-grep --pattern 'yield* $SERVICE' apps/server/src
```

- `$SERVICE` = nom du service (PilotProductRepository, Clock, etc.)

---

## Rewrite Patterns: Le Flag -r

### Syntaxe de Base

```bash
ast-grep --pattern 'OLD_PATTERN' -r 'NEW_PATTERN' apps/server/src
```

Les metavariables capturées dans `OLD_PATTERN` peuvent être réutilisées dans `NEW_PATTERN`.

### Exemple 1: Renommer Fonction

```bash
ast-grep --pattern 'oldFunctionName($$$)' \
         -r 'newFunctionName($$$)' \
         apps/server/src
```

**Avant:**

```typescript
oldFunctionName(a, b, c)
```

**Après:**

```typescript
newFunctionName(a, b, c)
```

Les arguments sont préservés grâce à `$$$`.

### Exemple 2: Renommer Schema Tag

```bash
ast-grep --pattern 'S.TaggedStruct("OldName", { $$$ })' \
         -r 'S.TaggedStruct("NewName", { $$$ })' \
         apps/server/src
```

**Avant:**

```typescript
S.TaggedStruct('OldName', {
  id: ProductIdSchema,
  label: S.String,
})
```

**Après:**

```typescript
S.TaggedStruct('NewName', {
  id: ProductIdSchema,
  label: S.String,
})
```

Les propriétés (`$$$`) sont préservées.

### Exemple 3: Ajouter Propriété

```bash
ast-grep --pattern 'S.TaggedStruct($NAME, { $$$ })' \
         -r 'S.TaggedStruct($NAME, { $$$, timestamp: S.Date })' \
         apps/server/src
```

**⚠️ Attention:** Cela ajoute `timestamp` à **tous** les TaggedStruct. Utiliser `--interactive` ou scope précis.

### Exemple 4: Wrapper dans Pipe

```bash
ast-grep --pattern 'S.String' \
         -r 'S.String.pipe(S.nonEmptyString())' \
         apps/server/src
```

**Problème:** Trop générique, matche tous les `S.String`.

**Solution:** Pattern plus précis:

```bash
ast-grep --pattern 'const $NAME = S.String' \
         -r 'const $NAME = S.String.pipe(S.nonEmptyString())' \
         apps/server/src
```

---

## Output Formats

### Default (Human-Readable)

```bash
ast-grep --pattern 'Effect.gen($$$)' apps/server/src
```

**Output:**

```
apps/server/src/application/pilot/handlers/create-pilot-product.handler.ts
40:  Effect.gen(function* () {
        ^^^^^^^^ matched

apps/server/src/application/pilot/handlers/create-pilot-product.handler.ts
62:  Effect.gen(function* () {
        ^^^^^^^^ matched
```

### JSON (Pour Scripting)

```bash
ast-grep --pattern 'Effect.gen($$$)' --json apps/server/src
```

**Output:**

```json
[
  {
    "file": "apps/server/src/application/pilot/handlers/create-pilot-product.handler.ts",
    "line": 40,
    "column": 2,
    "matches": [
      {
        "text": "Effect.gen(function* () { ... })",
        "metaVariables": {
          "$$$": { "value": "..." }
        }
      }
    ]
  }
]
```

**Post-processing avec jq:**

```bash
# Extraire juste les fichiers
ast-grep --pattern 'PATTERN' --json apps/server/src | jq -r '.[].file' | sort | uniq

# Compter matches par fichier
ast-grep --pattern 'PATTERN' --json apps/server/src | jq -r '.[].file' | sort | uniq -c

# Extraire metavariable
ast-grep --pattern 'S.TaggedStruct($NAME, { $$$ })' --json apps/server/src | \
  jq -r '.[].matches[].metaVariables.NAME.value'
```

### Count (Statistiques)

```bash
ast-grep --pattern 'Effect.gen($$$)' apps/server/src | grep -c "matched"
```

Ou avec JSON:

```bash
ast-grep --pattern 'Effect.gen($$$)' --json apps/server/src | jq 'length'
```

---

## Interactive Mode

### Flag --interactive

```bash
ast-grep --pattern 'OLD' -r 'NEW' --interactive apps/server/src
```

Pour chaque match, demande:

```
apps/server/src/domain/pilot/aggregate.ts:71
const PilotProductSchema = S.TaggedStruct("OLD", {

Replace? [y]es/[n]o/[a]ll/[q]uit:
```

**Options:**

- `y` - Oui, remplacer ce match
- `n` - Non, skip ce match
- `a` - Oui pour tous les matches restants
- `q` - Quitter sans plus de changements

**Quand utiliser:**

- Refactoring risqué (pas sûr de tous les matches)
- Vérification visuelle avant commit
- Patterns ambigus

**Quand ne pas utiliser:**

- Patterns très précis (perte de temps)
- Automation CI/CD

---

## Config Files: .ast-grep.yml

### Structure de Base

```yaml
# .ast-grep.yml à la racine du projet
ruleDirs:
  - .ast-grep/rules

utils:
  S-TaggedStruct:
    pattern: S.TaggedStruct($NAME, { $$$ })

  Effect-gen:
    pattern: Effect.gen(function* () { $$$ })
```

### Rules Directory

```
.ast-grep/
└── rules/
    ├── no-any-type.yml
    ├── require-branded-ids.yml
    └── require-tagged-struct.yml
```

**Exemple - require-branded-ids.yml:**

```yaml
id: require-branded-ids
message: IDs should use branded types (S.String.pipe(S.brand(...)))
severity: warning
language: typescript
rule:
  pattern: const $NAME = S.String
  constraints:
    NAME:
      regex: .*Id$
```

### Utilisation

```bash
# Scanner avec rules
ast-grep scan apps/server/src

# Output:
# Warning [require-branded-ids]: IDs should use branded types
#   --> apps/server/src/domain/pilot/value-objects/ids.ts:9
```

**Use case:**

- Linting architectural (enforce patterns)
- CI/CD checks
- Code reviews automatisés

---

## TypeScript-Specific Tips

### 1. Generics Matching

**Pattern:**

```bash
ast-grep --pattern 'Effect.Effect<$RETURN, $ERROR>' apps/server/src
```

Matche:

```typescript
Effect.Effect<PilotProduct, PersistenceError>
Effect.Effect<void, never>
```

**Extraction:**

```bash
ast-grep --pattern 'Effect.Effect<$RETURN, $ERROR>' --json apps/server/src | \
  jq -r '.[].matches[].metaVariables.ERROR.value' | sort | uniq
```

### 2. Type Annotations

**Pattern:**

```bash
ast-grep --pattern 'const $NAME: $TYPE = $$$' apps/server/src
```

Matche:

```typescript
const product: PilotProduct = MakePilotProduct(...)
```

### 3. Import Statements

**Pattern:**

```bash
ast-grep --pattern "import * as $NAME from 'effect'" apps/server/src
```

Matche:

```typescript
import * as Effect from 'effect'
import * as S from 'effect/Schema'
```

### 4. Export Statements

**Pattern:**

```bash
ast-grep --pattern 'export const $NAME = $$$' apps/server/src
```

**Note:** `export type` et `export interface` nécessitent patterns distincts.

---

## Effect-TS Specific Tips

### 1. Effect.gen Patterns

**Pattern simple:**

```bash
ast-grep --pattern 'Effect.gen($$$)' apps/server/src
```

**Pattern avec function\*:**

```bash
ast-grep --pattern 'Effect.gen(function* () { $$$ })' apps/server/src
```

**Pattern avec arrow:**

```bash
ast-grep --pattern 'Effect.gen(function*() { $$$ })' apps/server/src
```

**Gotcha:** Whitespace entre `function` et `*` - tester les deux variantes.

### 2. Schema DSL Patterns

**S.pipe chains:**

```bash
ast-grep --pattern 'S.String.pipe($$$)' apps/server/src
```

Matche:

```typescript
S.String.pipe(S.brand('ProductId'))
S.String.pipe(S.nonEmptyString(), S.brand('Email'))
```

**S.Struct vs S.TaggedStruct:**

```bash
# Simple struct (pas de _tag)
ast-grep --pattern 'S.Struct({ $$$ })' apps/server/src

# Tagged struct (_tag discriminator)
ast-grep --pattern 'S.TaggedStruct($NAME, { $$$ })' apps/server/src
```

### 3. Layer Composition Patterns

**Layer.mergeAll:**

```bash
ast-grep --pattern 'Layer.mergeAll($$$)' apps/server/src
```

**Layer.provide chains:**

```bash
ast-grep --pattern '$$.pipe(Layer.provide($$$))' apps/server/src
```

**Gotcha:** Pipes multi-lignes difficiles à matcher - scope au fichier.

### 4. Context.Tag Patterns

**Simple:**

```bash
ast-grep --pattern 'Context.Tag($TAG)' apps/server/src
```

**Avec class extends:**

```bash
ast-grep --pattern 'export class $CLASS extends Context.Tag($TAG)' apps/server/src
```

**Gotcha:** Generics multi-lignes - pattern peut ne pas matcher.

---

## Gotchas et Limitations

### 1. Multiline Patterns

**Problème:**

```typescript
const DevelopmentLayer = Layer.mergeAll(PilotProductLayer, CatalogProductLayer, EventPublisherLayer)
```

**Pattern qui ne matche pas:**

```bash
ast-grep --pattern 'Layer.mergeAll(PilotProductLayer, CatalogProductLayer, EventPublisherLayer)' apps/server/src
```

**Solution:** Pattern générique:

```bash
ast-grep --pattern 'Layer.mergeAll($$$)' apps/server/src
```

### 2. Greedy $$$ Capture

**Problème:**

```typescript
function foo(a, b) {
  function bar(c, d) {}
}
```

**Pattern:**

```bash
ast-grep --pattern 'function $NAME($$$) { $$$ }' apps/server/src
```

Matche la fonction extérieure `foo`, pas `bar` imbriquée.

**Solution:** Pattern plus précis ou scope au niveau de profondeur.

### 3. Comments et Strings Ignorés

**Bon:**

```typescript
const x = Effect.gen(...)  // ✅ Matche
```

**Ignorés:**

```typescript
'Effect.gen(...)' // ❌ String
// Effect.gen(...)  // ❌ Comment
```

C'est une **feature**, pas un bug - mais parfois on veut chercher dans comments.

**Solution:** Utiliser grep classique pour strings/comments.

### 4. Whitespace et Formatting

ast-grep ignore le formatting:

```typescript
Effect.gen(...)  // ✅ Matche
Effect  .  gen(...)  // ✅ Matche aussi
Effect
  .gen(...)  // ✅ Matche aussi
```

C'est généralement bon, mais parfois trop permissif.

---

## Combiner ast-grep avec Autres Outils

### ast-grep + grep

```bash
# Trouver Effect.gen qui yield* un service spécifique
ast-grep --pattern 'Effect.gen(function* () { $$$ })' apps/server/src | \
  grep -A 5 "yield\* PilotProductRepository"
```

### ast-grep + jq

```bash
# Extraire noms de tous les aggregates
ast-grep --pattern 'S.TaggedStruct($NAME, { $$$ })' \
         --json \
         apps/server/src/domain | \
  jq -r '.[].matches[].metaVariables.NAME.value'
```

### ast-grep + sed

```bash
# ast-grep pour trouver, sed pour remplacer (quand ast-grep pattern est trop complexe)
for file in $(ast-grep --pattern 'PATTERN' apps/server/src --json | jq -r '.[].file'); do
  sed -i '' 's/OLD/NEW/g' "$file"
done
```

### ast-grep + TypeScript

```bash
# Refactor puis valider
ast-grep --pattern 'OLD' -r 'NEW' apps/server/src
pnpm typecheck  # TypeScript détecte erreurs
```

**Workflow recommandé:** ast-grep (refactor) → TypeScript (validate) → tests (verify).

---

## Debugging Patterns

### Flag --debug-query

```bash
ast-grep --pattern 'PATTERN' --debug-query apps/server/src
```

**Output:**

```
Query AST:
CallExpression
  MemberExpression
    Identifier: Effect
    Identifier: gen
  Arguments: [...]
```

Utile quand pattern ne matche pas comme attendu.

### Test Minimal

Si pattern complexe ne fonctionne pas:

1. Simplifier au maximum
2. Tester sur 1 fichier
3. Ajouter complexité progressivement

**Exemple:**

```bash
# Test 1: Juste le nom
ast-grep --pattern 'Effect' apps/server/src/domain/pilot/aggregate.ts

# Test 2: Member access
ast-grep --pattern 'Effect.gen' apps/server/src/domain/pilot/aggregate.ts

# Test 3: Avec arguments
ast-grep --pattern 'Effect.gen($$$)' apps/server/src/domain/pilot/aggregate.ts
```

### Online Playground

[ast-grep.github.io/playground](https://ast-grep.github.io/playground)

Tester patterns en temps réel avec AST visualisé.

---

## Performance Tips

### 1. Scope Précis

**Lent:**

```bash
ast-grep --pattern 'PATTERN' .
```

**Rapide:**

```bash
ast-grep --pattern 'PATTERN' apps/server/src/domain
```

### 2. Ignore Directories

```bash
ast-grep --pattern 'PATTERN' apps/server/src --ignore-dirs node_modules,dist,.turbo
```

### 3. File Type Filtering

```bash
# Uniquement .ts (pas .js, .json, etc.)
ast-grep --pattern 'PATTERN' apps/server/src/**/*.ts
```

### 4. Parallel Processing

ast-grep est déjà parallélisé, mais pour multiple queries:

```bash
# Parallel avec GNU parallel
parallel ast-grep --pattern {} apps/server/src ::: "Pattern1" "Pattern2" "Pattern3"
```

---

## Résumé: Quand Utiliser ast-grep

### ✅ Bon Pour

- Refactoring patterns complexes (Schema, Layer, Effect.gen)
- Recherche structurelle (ignore comments/strings)
- Multi-fichiers (évite lecture manuelle)
- Rewrite automatisé avec validation

### ❌ Moins Bon Pour

- Recherche simple de string (utiliser Grep)
- 1-2 fichiers (Read + manual)
- Ajout de code nouveau (Edit/Write)
- Patterns très spécifiques à 1 fichier

### 🤝 Combine Avec

- TypeScript (validation après refactor)
- Tests (verify behavior)
- jq (post-processing JSON)
- sed/perl (complex rewrite)
- CI/CD (linting architectural)
