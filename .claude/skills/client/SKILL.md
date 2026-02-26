---
name: client
description: "Crée et modifie les pages, composants et hooks de l'application client Next.js (MUI 7, Effect-TS). Utiliser quand: (1) Créer une nouvelle page (route), (2) Ajouter un composant UI, (3) Créer un hook custom, (4) Ajouter une Server Action, (5) Créer/modifier un Context React, (6) Câbler un nouvel endpoint API côté client, (7) Ajouter un loading skeleton, (8) Ajouter une error boundary, (9) Modifier le thème ou les tokens, (10) Ajouter un item de navigation, (11) Create a page, (12) Add a component, (13) Create a hook, (14) Add a server action, (15) Create a context, (16) Wire an API endpoint, (17) Add a loading skeleton, (18) Add an error boundary, (19) Modify the theme, (20) Add a nav item."
---

# Skill: Client UI (Next.js / MUI / Effect-TS)

> Crée et modifie les pages, composants et hooks de l'application client Next.js.

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
│   ├── layout.tsx          # Root layout (fonts, NavigationRail, ThemeRegistry)
│   └── {feature}/
│       ├── page.tsx        # Page (Server Component)
│       ├── actions.ts      # Server Actions
│       ├── loading.tsx     # Skeleton loading (mirrors page structure)
│       └── (detail)/       # Route groups
│           ├── new/page.tsx
│           └── [id]/
│               ├── page.tsx
│               └── error.tsx  # Error boundary
├── components/
│   ├── layout/             # NavigationRail, constants
│   └── {feature}/          # Composants par feature
│       ├── {Feature}DetailShell.tsx   # Provider wrapper
│       ├── {Feature}EditorContent.tsx # Orchestrateur (lit context, passe props)
│       ├── {Feature}EditorHeader.tsx  # Header avec actions
│       ├── {Feature}Card.tsx          # Card pour listes
│       ├── {Feature}ListGrid.tsx      # Page de liste
│       └── constants.ts               # Labels, status config, helpers
├── contexts/               # React Contexts
├── hooks/                  # Hooks custom
├── lib/                    # Utilitaires
│   ├── api-client.ts       # HttpApiClient Effect
│   ├── config.ts           # Config publique
│   └── config.server.ts    # Config serveur-only
└── theme/
    ├── theme.ts            # Tokens + createTheme (design system complet)
    └── ThemeRegistry.tsx   # ThemeProvider + CssBaseline
```

## Design system

### Tokens

Le thème exporte un objet `tokens` utilisable directement dans les composants :

```typescript
import { tokens } from '@/theme/theme'

// Utilisation dans sx
sx={{ color: tokens.graphite, borderColor: tokens.ash }}
```

Palette tokens : `ember` (primary orange), `olive` (secondary), `charcoal→pearl` (neutral scale 10 steps).

### Principes visuels

- **Sharp corners** : `borderRadius: 0` partout
- **Borders > shadows** : `boxShadow: 'none'` + `border: '1px solid'`
- **Transitions** : `transition: '0.15s ease'` sur tous les éléments interactifs
- **Alpha hovers** : `alpha(tokens.ember, 0.04)` pour les hover states subtils
- **Polices** : DM Serif Display (h1-h4 display), DM Sans (h5+, body, UI)

### Imports MUI

Toujours utiliser les deep imports + icons variante `Rounded` :

```typescript
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
```

## Conventions de nommage

| Pattern       | Convention                                   | Exemple                           |
| ------------- | -------------------------------------------- | --------------------------------- |
| Page          | `page.tsx` dans `app/{route}/`               | `app/products/page.tsx`           |
| Server Action | `actions.ts` dans `app/{route}/`             | `app/products/actions.ts`         |
| Component     | `{PascalCase}.tsx` dans `components/{area}/` | `ProductEditorContent.tsx`        |
| Hook          | `use{Name}.ts` dans `hooks/`                 | `useImageUpload.ts`               |
| Context       | `{Name}Context.tsx` dans `contexts/`         | `ProductFormContext.tsx`          |
| Constants     | `constants.ts` dans `components/{area}/`     | `components/product/constants.ts` |
| Layout const  | `constants.ts` dans `components/layout/`     | `NAV_RAIL_WIDTH`                  |
| Config        | `config.ts` / `config.server.ts` dans `lib/` | `config.server.ts`                |

## Patterns

### 1. Page (Server Component)

```typescript
import { runApiPage } from '@/lib/api-client'

export default async function FeaturePage() {
  const data = await runApiPage(
    (client) => client['endpoint-group'].method(),
    { notFoundOn: 'ApiNotFoundError' }  // optionnel
  )
  return <ClientComponent data={data} />
}
```

**Next.js 16** : `params` est une `Promise` — il faut `await` :

```typescript
type Props = { params: Promise<{ id: string }> }

export default async function DetailPage({ params }: Props) {
  const { id } = await params
  // ...
}
```

### 2. Server Action

```typescript
'use server'

import { runApi } from '@/lib/api-client'
import { throwApiError } from '@/lib/throw-api-error'

export async function createSomething(input: CreateRequest) {
  const exit = await runApi((client) => client['endpoint-group'].create({ payload: input }))
  return throwApiError(exit)
}
```

### 3. Shell (Provider + layout wrapper)

Le Shell est minimaliste — Provider + conteneur flex column :

```typescript
'use client'

import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import { FeatureFormProvider, type FeatureFormInitialData } from '@/contexts/FeatureFormContext'

interface Props {
  initialData?: FeatureFormInitialData
  children: ReactNode
}

export default function FeatureDetailShell({ initialData, children }: Props) {
  return (
    <FeatureFormProvider initialData={initialData}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>{children}</Box>
    </FeatureFormProvider>
  )
}
```

### 4. EditorContent (orchestrateur)

Composant central qui lit le context et distribue les props aux sous-composants :

```typescript
'use client'

export default function FeatureEditorContent() {
  const { title, setTitle, /* ... */ } = useFeatureForm()

  return (
    <>
      <FeatureEditorHeader title={title} /* props explicites */ />
      <Box sx={{ flex: 1, overflow: 'auto', px: { xs: 2.5, md: 4 }, py: 2 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ maxWidth: 1400, mx: 'auto' }}>
          {/* Colonne gauche */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <ChildComponent prop={value} />
          </Box>
          {/* Colonne droite */}
          <Box sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
            <SidePanel prop={value} />
          </Box>
        </Stack>
      </Box>
    </>
  )
}
```

**Pattern** : l'EditorContent est le seul composant qui appelle `useFeatureForm()`. Les enfants reçoivent leurs données via props (pas d'accès context direct).

### 5. Constants par feature

Chaque feature a un `constants.ts` pour les labels et la config UI :

```typescript
import { tokens } from '@/theme/theme'

export const typeLabels: Record<string, string> = {
  TAPIS: 'Tapis',
  COUSSIN: 'Coussin',
}

export const statusConfig: Record<string, { label: string; color: string }> = {
  PUBLISHED: { label: 'Publié', color: '#4a7a40' },
  DRAFT: { label: 'Brouillon', color: '#8b8635' },
  ARCHIVED: { label: 'Archivé', color: '#8a8a8a' },
}

export function getStatusProps(status: string): { label: string; color: string } {
  return statusConfig[status] ?? { label: status, color: tokens.pewter }
}
```

### 6. Loading skeleton

Le skeleton mirror la structure exacte de la page correspondante :

```typescript
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'

export default function FeatureLoading() {
  return (
    <Box sx={{ px: { xs: 3, md: 4 }, py: { xs: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Reproduire le layout exact de la page avec Skeleton */}
      <Skeleton variant="text" width={160} height={44} />
      <Grid container spacing={2}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <Skeleton variant="rounded" sx={{ aspectRatio: '1', width: '100%', borderRadius: 0 }} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
```

### 7. Error boundary

Pattern avec notistack, useTransition, et correlation ID :

```typescript
'use client'

import { useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'
import { tokens } from '@/theme/theme'

interface Props {
  error: Error & { digest?: string; correlationId?: string }
  reset: () => void
}

export default function FeatureError({ error, reset }: Props) {
  const { enqueueSnackbar } = useSnackbar()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const ref = error.correlationId ?? error.digest

  useEffect(() => {
    enqueueSnackbar(ref ? `Erreur. Réf: ${ref}` : 'Erreur de chargement.', {
      variant: 'error',
      autoHideDuration: 8000,
    })
  }, [enqueueSnackbar, ref])

  const handleRetry = () => startTransition(() => { router.refresh(); reset() })

  return (
    <Box sx={{ p: { xs: 3, md: 5 }, maxWidth: 520 }}>
      <Box sx={{ borderLeft: '3px solid', borderColor: 'error.main', pl: 2.5, py: 0.5 }}>
        <Typography variant="h6" sx={{ color: 'error.main' }}>Erreur</Typography>
        <Typography variant="body1">Le chargement a échoué.</Typography>
      </Box>
      {/* Buttons: Réessayer + Retour */}
    </Box>
  )
}
```

### 8. Hook custom avec Effect-TS

```typescript
'use client'

import { useState, useCallback } from 'react'
import { gen, catchAll, runPromise } from 'effect/Effect'

export function useSomething() {
  const [state, setState] = useState(initialState)

  const doSomething = useCallback((input: Input) => {
    const program = gen(function* () {
      const result = yield* someEffect(input)
      return result
    }).pipe(catchAll((error) => /* handle error */))

    void runPromise(program)
  }, [])

  return { state, doSomething }
}
```

### 9. Context React

```typescript
'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface FeatureFormContextType {
  title: string
  mode: 'create' | 'edit'
  canSave: boolean
  isSaving: boolean
  setTitle: (title: string) => void
  save: (publish: boolean) => void
}

const FeatureFormContext = createContext<FeatureFormContextType | null>(null)

export function useFeatureForm() {
  const ctx = useContext(FeatureFormContext)
  if (!ctx) throw new Error('useFeatureForm must be used within FeatureFormProvider')
  return ctx
}

export function FeatureFormProvider({ initialData, children }: Props) {
  const mode = initialData ? 'edit' : 'create'
  // ... state management
  return (
    <FeatureFormContext.Provider value={{ /* ... */ }}>
      {children}
    </FeatureFormContext.Provider>
  )
}
```

### 10. Navigation Rail

Pour ajouter un item de navigation, modifier le tableau `navItems` dans `components/layout/Sidebar.tsx` :

```typescript
const navItems = [
  { label: 'Accueil', href: '/', icon: HomeRoundedIcon },
  { label: 'Produits', href: '/products', icon: Inventory2RoundedIcon },
  // Ajouter ici
]
```

## Communication avec le serveur

| Helper       | Usage                     | Erreurs                         | Contexte             |
| ------------ | ------------------------- | ------------------------------- | -------------------- |
| `runApiPage` | Server Components (pages) | Déclenche `notFound()` ou throw | SSR                  |
| `runApi`     | Server Actions, hooks     | Retourne `Exit<A, E>`           | Client/Server Action |

Le `HttpApiClient` dans `api-client.ts` est généré depuis `@maison-amane/api` — pas besoin de le modifier.

## Checklist nouveau feature client

- [ ] Page Server Component (`app/{feature}/page.tsx`)
- [ ] Server Action si mutation (`app/{feature}/actions.ts`)
- [ ] Shell provider (`components/{feature}/{Feature}DetailShell.tsx`)
- [ ] EditorContent orchestrateur (`components/{feature}/{Feature}EditorContent.tsx`)
- [ ] Composants enfants avec props explicites
- [ ] Constants labels/status (`components/{feature}/constants.ts`)
- [ ] Context si state partagé (`contexts/`)
- [ ] Hook si logique async complexe (`hooks/`)
- [ ] Loading skeleton qui mirror la page (`loading.tsx`)
- [ ] Error boundary avec notistack (`error.tsx`)
- [ ] Item dans `navItems` de Sidebar si nouvelle section

## Références

- API client : `apps/client/src/lib/api-client.ts`
- Thème + tokens : `apps/client/src/theme/theme.ts`
- Contrats API : `packages/api/src/routes.ts`
- Exemple complet : feature Products (`app/products/`, `components/product/`, `contexts/ProductFormContext.tsx`)
