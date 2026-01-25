# Guide de Contribution

Ce guide explique les conventions et outils mis en place pour garantir la qualité du code dans ce projet.

## 📋 Commits Normés

Ce projet utilise la convention [Conventional Commits](https://www.conventionalcommits.org/).

### Format du Message de Commit

```
<type>(<scope>): <description>

[corps optionnel]

[footer optionnel]
```

### Types Autorisés

- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation uniquement
- `style`: Changements de style (formatage, point-virgules manquants, etc.)
- `refactor`: Refactoring (ni correction ni ajout de fonctionnalité)
- `perf`: Amélioration des performances
- `test`: Ajout ou modification de tests
- `build`: Changements du système de build ou dépendances
- `ci`: Configuration CI/CD
- `chore`: Autres changements (ne modifie pas src ou test)
- `revert`: Annulation d'un commit précédent

### Scopes Valides

#### Apps

- `server` - Application serveur principale
- `client` - Application client
- `catalog-projection` - Consumer de projection catalogue
- `shopify-sync` - Consumer de synchronisation Shopify

#### Packages

- `api` - Couche API partagée
- `shared-kernel` - Domaine et config partagés

#### Scopes Spéciaux

- `root` - Changements à la racine (package.json, turbo.json, etc.)
- `deps` - Mises à jour de dépendances
- `release` - Changements liés aux releases
- `monorepo` - Changements affectant tout le monorepo

**Note**: Les scopes personnalisés sont acceptés mais génèrent un avertissement.

### Exemples de Commits

```bash
# Nouvelle fonctionnalité
feat(server): add user authentication endpoint

# Correction de bug
fix(catalog-projection): handle null product variants

# Mise à jour de dépendances
chore(deps): upgrade effect to v3.14.0

# Refactoring
refactor(api): simplify error handling logic

# Documentation
docs(root): update contributing guidelines
```

## 🚀 Méthodes de Commit

### Méthode 1 : Interface Interactive (Recommandée)

Utilisez Commitizen pour une interface guidée :

```bash
pnpm commit
```

L'assistant vous posera des questions pour construire un commit valide.

### Méthode 2 : Commit Manuel

```bash
git commit -m "feat(server): add new endpoint"
```

Le message sera automatiquement validé par commitlint.

## 🔍 Validations Pré-Commit

Lors de chaque commit, les validations suivantes s'exécutent automatiquement via **lint-staged** :

### Pour les fichiers TypeScript/JavaScript

1. **Prettier** - Formatage automatique du code
2. **ESLint** - Vérification et correction automatique
3. **Type-check** - Validation TypeScript (via turbo)
4. **Tests** - Exécution des tests (via turbo avec cache)

### Pour les fichiers JSON/Markdown/YAML

- **Prettier** - Formatage uniquement

**Important** : Si une validation échoue, le commit sera **bloqué**. Corrigez les erreurs avant de recommiter.

## 🛠️ Scripts Disponibles

```bash
# Formater tout le code
pnpm format

# Linter tout le code
pnpm lint

# Vérification de types
pnpm typecheck

# Lancer les tests
pnpm test

# Builder le projet
pnpm build

# Commit interactif
pnpm commit
```

## 📝 Configuration ESLint

Le projet utilise ESLint avec :

- **TypeScript** - Support complet avec `@typescript-eslint`
- **Prettier** - Intégration pour éviter les conflits
- **Effect-TS** - Règles adaptées au code fonctionnel
  - Variables se terminant par `Schema` exemptées de no-unused-vars
  - Redéclaration autorisée (pattern Effect Schema)
  - Générateurs sans yield autorisés

### Désactiver ESLint Localement

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = someUnsafeOperation()
```

## 🎯 Bonnes Pratiques

### 1. Commits Atomiques

Chaque commit doit représenter une unité logique de changement :

```bash
# ✅ Bon
feat(server): add user login endpoint
feat(server): add user logout endpoint

# ❌ Mauvais
feat(server): add authentication system
```

### 2. Messages Descriptifs

```bash
# ✅ Bon
fix(catalog-projection): prevent duplicate product entries

# ❌ Mauvais
fix: bug
```

### 3. Corps du Message (optionnel mais recommandé)

Pour les changements complexes, ajoutez un corps :

```bash
git commit -m "feat(api): add pagination support

Implement cursor-based pagination for product listings.
This improves performance for large datasets.

- Add PaginationParams schema
- Update product endpoints
- Add integration tests"
```

### 4. Breaking Changes

Indiquez les breaking changes avec `!` ou dans le footer :

```bash
# Méthode 1
feat(api)!: redesign product schema

# Méthode 2
feat(api): redesign product schema

BREAKING CHANGE: Product schema now uses Effect Schema v2
```

## 🚫 Que Faire Si le Commit Échoue ?

### Erreur Commitlint

```
⧗   input: bad commit message
✖   subject may not be empty [subject-empty]
```

**Solution** : Vérifiez le format de votre message de commit.

### Erreur Prettier

```
[FAILED] prettier --write file.ts
```

**Solution** : Prettier auto-corrige. Recommitez simplement.

### Erreur ESLint

```
✖ 3 problems (3 errors, 0 warnings)
```

**Solution** : Corrigez les erreurs dans votre code et recommitez.

### Erreur TypeScript

```
error TS2322: Type 'string' is not assignable to type 'number'
```

**Solution** : Corrigez les erreurs de type et recommitez.

### Tests Échoués

```
FAIL src/domain/product.test.ts
```

**Solution** : Corrigez les tests ou le code testé, puis recommitez.

## 🔧 Désactiver Temporairement les Hooks

**⚠️ À utiliser avec précaution !**

```bash
git commit --no-verify -m "message"
```

**Note** : Cela contourne toutes les validations. À réserver pour les cas d'urgence uniquement.

## 📚 Ressources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commitlint](https://commitlint.js.org/)
- [Commitizen](https://github.com/commitizen/cz-cli)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [Husky](https://typicode.github.io/husky/)

## 🤝 Support

Si vous rencontrez des problèmes avec le système de commits ou les validations, contactez l'équipe de développement.
