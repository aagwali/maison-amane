# Query Handlers

## Get by ID

```typescript
// application/{context}/queries/get-{entity}-by-id.query.ts
import { Effect, Option } from 'effect'

import type { {Entity}, {Entity}Id } from '../../../domain/{context}'
import { {Entity}NotFound } from '../../../domain/{context}'
import { {Entity}Repository } from '../../../ports/driven'

export const get{Entity}ById = (
  id: {Entity}Id
): Effect.Effect<{Entity}, {Entity}NotFound, {Entity}Repository> =>
  Effect.gen(function* () {
    const repo = yield* {Entity}Repository
    const maybeEntity = yield* repo.findById(id)

    return yield* Option.match(maybeEntity, {
      onNone: () =>
        Effect.fail(new {Entity}NotFound({ id: String(id) })),
      onSome: Effect.succeed,
    })
  })
```

## List All

```typescript
// application/{context}/queries/list-{entities}.query.ts
import { Effect } from 'effect'

import type { {Entity} } from '../../../domain/{context}'
import { {Entity}Repository } from '../../../ports/driven'

export const list{Entity}s = (): Effect.Effect<
  readonly {Entity}[],
  never,  // Pas d'erreur (liste vide si rien)
  {Entity}Repository
> =>
  Effect.gen(function* () {
    const repo = yield* {Entity}Repository
    return yield* repo.findAll()
  })
```

## Search with Filters

```typescript
// application/{context}/queries/search-{entities}.query.ts
import { Effect } from 'effect'

import type { {Entity}, {Entity}Status } from '../../../domain/{context}'
import { {Entity}Repository } from '../../../ports/driven'

export interface Search{Entity}sQuery {
  readonly status?: {Entity}Status
  readonly category?: string
  readonly limit?: number
  readonly offset?: number
}

export const search{Entity}s = (
  query: Search{Entity}sQuery
): Effect.Effect<readonly {Entity}[], never, {Entity}Repository> =>
  Effect.gen(function* () {
    const repo = yield* {Entity}Repository

    // Le repository expose une méthode search ou on filtre côté application
    return yield* repo.search({
      status: query.status,
      category: query.category,
      pagination: {
        limit: query.limit ?? 50,
        offset: query.offset ?? 0,
      },
    })
  })
```

## Query avec projection (Read Model)

Pour les queries UI-optimized, utiliser le read model :

```typescript
// application/catalog/queries/get-catalog-products.query.ts
import { Effect, Option } from 'effect'

import type { CatalogProduct, ProductId } from '../../../domain/catalog'
import { QueryError } from '../errors'
import { CatalogProductRepository } from '../../../ports/driven'

export const getCatalogProductById = (
  id: ProductId
): Effect.Effect<Option.Option<CatalogProduct>, QueryError, CatalogProductRepository> =>
  Effect.gen(function* () {
    const repo = yield* CatalogProductRepository
    return yield* repo
      .findById(id)
      .pipe(Effect.mapError((e) => new QueryError({ operation: 'findById', cause: e })))
  })

export const listCatalogProducts = (): Effect.Effect<
  readonly CatalogProduct[],
  QueryError,
  CatalogProductRepository
> =>
  Effect.gen(function* () {
    const repo = yield* CatalogProductRepository
    return yield* repo
      .findAll()
      .pipe(Effect.mapError((e) => new QueryError({ operation: 'findAll', cause: e })))
  })
```

## Erreur spécifique aux queries

```typescript
// application/{context}/errors.ts
import { Data } from 'effect'

export class QueryError extends Data.TaggedError('QueryError')<{
  readonly operation: string
  readonly cause: unknown
}> {}
```

## Différence Command vs Query

| Aspect         | Command            | Query                |
| -------------- | ------------------ | -------------------- |
| **Effet**      | Modifie l'état     | Lecture seule        |
| **Retour**     | L'entité modifiée  | Données demandées    |
| **Erreurs**    | Validation, métier | NotFound, technique  |
| **Events**     | Peut émettre       | Jamais               |
| **Repository** | Write model        | Read model (si CQRS) |

## Checklist

- [ ] Pas de modification d'état
- [ ] Signature claire (`Effect<Data, Error, Deps>`)
- [ ] Option pour résultat nullable (findById)
- [ ] Array pour listes (même vides)
- [ ] Erreur NotFound pour get by ID
- [ ] Pas d'émission d'events
