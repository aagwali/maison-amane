# Skill: Client UI (Next.js / MUI / Effect-TS)

> Crée et modifie les pages, composants et hooks de l'application client Next.js.

## Quand utiliser ce skill

- Créer une nouvelle page (route)
- Ajouter un composant UI
- Créer un hook custom
- Ajouter une Server Action
- Créer/modifier un Context React
- Câbler un nouvel endpoint API côté client

## Stack & versions

| Technologie       | Version   | Usage                                         |
| ----------------- | --------- | --------------------------------------------- |
| Next.js           | 16.1.0    | App Router, Server Components, Server Actions |
| React             | 19.0.0    | UI, hooks, contexts                           |
| MUI               | 7.3.0     | Composants UI, thème, Grid                    |
| Effect-TS         | 3.13.1    | API client, hooks async                       |
| notistack         | 3.0.2     | Notifications snackbar                        |
| @maison-amane/api | workspace | Contrats API type-safe                        |

## Architecture client

```
apps/client/src/
├── app/                    # Pages (App Router)
│   ├── layout.tsx          # Root layout
│   └── {feature}/
│       ├── page.tsx        # Page (Server Component)
│       ├── actions.ts      # Server Actions
│       ├── loading.tsx     # Skeleton loading
│       └── (detail)/       # Route groups
├── components/             # Composants UI
│   ├── layout/             # Navigation, panels
│   └── {feature}/          # Composants par feature
├── contexts/               # React Contexts
├── hooks/                  # Hooks custom
├── lib/                    # Utilitaires
│   ├── api-client.ts       # HttpApiClient Effect
│   ├── config.ts           # Config publique
│   └── config.server.ts    # Config serveur-only
└── theme/                  # MUI theme
```

## Conventions de nommage

| Pattern       | Convention                                   | Exemple                   |
| ------------- | -------------------------------------------- | ------------------------- |
| Page          | `page.tsx` dans `app/{route}/`               | `app/products/page.tsx`   |
| Server Action | `actions.ts` dans `app/{route}/`             | `app/products/actions.ts` |
| Component     | `{PascalCase}.tsx` dans `components/{area}/` | `ProductListGrid.tsx`     |
| Hook          | `use{Name}.ts` dans `hooks/`                 | `useImageUpload.ts`       |
| Context       | `{Name}Context.tsx` dans `contexts/`         | `ProductFormContext.tsx`  |
| Config        | `config.ts` / `config.server.ts` dans `lib/` | `config.server.ts`        |

## Patterns à suivre

### 1. Page (Server Component)

Les pages sont des Server Components async qui chargent les données côté serveur.

**Fichier** : `app/{feature}/page.tsx`

```typescript
import { runApiPage } from '@/lib/api-client'
// Pas de 'use client' — Server Component par défaut

export default async function FeaturePage() {
  const data = await runApiPage(
    (client) => client['endpoint-group'].method(),
    { notFoundOn: 'ApiNotFoundError' }  // optionnel : déclenche notFound()
  )

  return <ClientComponent data={data} />
}
```

**Règles** :

- Toujours `async` (Server Component)
- Utiliser `runApiPage()` pour les appels API (gère les erreurs automatiquement)
- Déléguer l'interactivité à des composants `'use client'`

### 2. Page avec paramètres dynamiques

**Fichier** : `app/{feature}/[id]/page.tsx`

```typescript
type Props = { params: Promise<{ id: string }> }

export default async function DetailPage({ params }: Props) {
  const { id } = await params  // Next.js 16 : params est une Promise
  const data = await runApiPage(
    (client) => client['endpoint-group'].getById({ path: { id } }),
    { notFoundOn: 'ApiNotFoundError' }
  )

  return <DetailShell initialData={data} />
}
```

**Attention** : Dans Next.js 16, `params` est une `Promise` — il faut `await`.

### 3. Server Action

**Fichier** : `app/{feature}/actions.ts`

```typescript
'use server'

import { runApi } from '@/lib/api-client'
import { throwApiError } from '@/lib/throw-api-error'

export async function createSomething(input: CreateRequest) {
  const exit = await runApi((client) => client['endpoint-group'].create({ payload: input }))
  return throwApiError(exit)
}

export async function updateSomething(id: string, input: UpdateRequest) {
  const exit = await runApi((client) =>
    client['endpoint-group'].update({ path: { id }, payload: input })
  )
  return throwApiError(exit)
}
```

**Règles** :

- Fichier marqué `'use server'` en haut
- Utiliser `runApi()` (retourne un `Exit`)
- Utiliser `throwApiError()` pour transformer l'Exit en résultat ou throw
- Nommer en camelCase : `createProduct`, `updateProduct`, `registerMedia`

### 4. Composant Shell (layout + provider)

**Fichier** : `components/{feature}/{Feature}DetailShell.tsx`

```typescript
'use client'

import { FeatureFormProvider } from '@/contexts/FeatureFormContext'

interface Props {
  initialData?: FeatureFormInitialData
  children: React.ReactNode
}

export function FeatureDetailShell({ initialData, children }: Props) {
  return (
    <FeatureFormProvider initialData={initialData}>
      <Box sx={{ display: 'flex', gap: 3 }}>
        <Box sx={{ flex: 1 }}>{children}</Box>
        <ActionPanel />
      </Box>
    </FeatureFormProvider>
  )
}
```

**Pattern** : Shell = layout + context provider. Content = UI pure qui lit le context.

### 5. Hook custom avec Effect-TS

**Fichier** : `hooks/use{Name}.ts`

```typescript
'use client'

import { useState, useCallback } from 'react'
import { gen, all, catchAll, runPromise } from 'effect/Effect'

export function useSomething() {
  const [state, setState] = useState(initialState)

  const doSomething = useCallback((input: Input) => {
    const program = gen(function* () {
      // Logique Effect
      const result = yield* someEffect(input)
      return result
    }).pipe(
      catchAll((error) => /* handle error */)
    )

    void runPromise(program)
  }, [])

  return { state, doSomething }
}
```

**Règles** :

- Imports sélectifs Effect : `import { gen, runPromise } from 'effect/Effect'`
- `void runPromise(program)` pour fire-and-forget dans les callbacks React
- setState dans les effets via `sync(() => setState(...))`

### 6. Context React

**Fichier** : `contexts/{Name}Context.tsx`

```typescript
'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface FeatureFormContextType {
  // State
  title: string
  mode: 'create' | 'edit'
  canSave: boolean
  isSaving: boolean
  // Actions
  setTitle: (title: string) => void
  save: () => void
}

const FeatureFormContext = createContext<FeatureFormContextType | null>(null)

export function useFeatureForm() {
  const ctx = useContext(FeatureFormContext)
  if (!ctx) throw new Error('useFeatureForm must be used within FeatureFormProvider')
  return ctx
}

interface Props {
  initialData?: InitialData
  children: ReactNode
}

export function FeatureFormProvider({ initialData, children }: Props) {
  const mode = initialData ? 'edit' : 'create'
  const [title, setTitle] = useState(initialData?.title ?? '')
  // ... state management

  return (
    <FeatureFormContext.Provider value={{ title, mode, canSave, isSaving, setTitle, save }}>
      {children}
    </FeatureFormContext.Provider>
  )
}
```

**Pattern** : Context + Provider + hook `use{Feature}Form()`.

### 7. API Client — runApi vs runApiPage

| Helper       | Usage                     | Erreurs                         | Contexte             |
| ------------ | ------------------------- | ------------------------------- | -------------------- |
| `runApiPage` | Server Components (pages) | Déclenche `notFound()` ou throw | SSR                  |
| `runApi`     | Server Actions, hooks     | Retourne `Exit<A, E>`           | Client/Server Action |

**Fichier de référence** : `apps/client/src/lib/api-client.ts`

### 8. Câbler un nouvel endpoint

Quand un nouvel endpoint est ajouté côté serveur (via le skill `api-endpoint`) :

1. Le contrat est dans `packages/api/src/` → automatiquement disponible via `@maison-amane/api`
2. Le `HttpApiClient` dans `api-client.ts` le rend disponible type-safe
3. Créer la Server Action dans `app/{feature}/actions.ts`
4. Appeler depuis le composant via le context ou directement

**Pas besoin de modifier `api-client.ts`** — le client est généré depuis les routes du package `@maison-amane/api`.

## Communication avec le serveur

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT (Next.js)                   │
│                                                       │
│  Server Component ──runApiPage()──→ HttpApiClient     │
│  Server Action ────runApi()───────→ HttpApiClient     │
│  Hook (Effect) ───Cloudinary XHR──→ Cloudinary CDN   │
│                  ──registerMedia()─→ Server Action     │
│                                                       │
│  HttpApiClient ←── @maison-amane/api (type-safe)     │
└───────────────────────┬───────────────────────────────┘
                        │ HTTP
┌───────────────────────▼───────────────────────────────┐
│                    SERVER (Effect HTTP)                │
│  GET  /api/pilot-product      → listAll / getById     │
│  POST /api/pilot-product      → create                │
│  PUT  /api/pilot-product/:id  → update                │
│  POST /api/media              → register              │
└───────────────────────────────────────────────────────┘
```

## Checklist nouveau feature client

- [ ] Page Server Component (`app/{feature}/page.tsx`)
- [ ] Server Action si mutation (`app/{feature}/actions.ts`)
- [ ] Composant(s) `'use client'` si interactivité
- [ ] Context si state partagé entre composants (`contexts/`)
- [ ] Hook si logique async complexe (`hooks/`)
- [ ] Loading skeleton (`loading.tsx`)
- [ ] Error boundary (`error.tsx`) si page dynamique
- [ ] Lien dans Sidebar si nouvelle section de navigation

## Références

- API client : `apps/client/src/lib/api-client.ts`
- Thème MUI : `apps/client/src/theme/theme.ts`
- Contrats API : `packages/api/src/routes.ts`
- Exemple complet : feature Products (`app/products/`, `components/product/`, `contexts/ProductFormContext.tsx`)
