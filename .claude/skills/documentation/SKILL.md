---
name: documentation
description: 'Crée et modifie les pages Docusaurus dans apps/docs/ : pages data-flow (séquences Mermaid, étapes de transformation, tabs détails), pages architecture (flowcharts, composants, principes), glossaire (entrées ubiquitous language). Utiliser quand: (1) Documenter un nouveau flux de données, (2) Ajouter une page data-flow, (3) Mettre à jour le glossaire, (4) Ajouter un terme au glossaire, (5) Documenter une feature, (6) Créer une page architecture, (7) Mettre à jour la documentation, (8) Ajouter un diagramme Mermaid, (9) Documenter un consumer, (10) Documenter un endpoint, (11) Document a data flow, (12) Add a docs page, (13) Update the glossary, (14) Add architecture documentation, (15) Document a feature, (16) Add a Mermaid diagram, (17) Update documentation, (18) Document a new flow, (19) Add a glossary entry, (20) Create a docs page.'
---

# Documentation Skill

Crée et modifie les pages Docusaurus (MDX) dans `apps/docs/docs/`. Couvre deux types de pages : **data-flow** et **architecture**, plus la mise à jour du **glossaire**.

## Workflow — Page Data Flow

1. Identifier le flux à documenter (quel BC, quels events, quels consumers)
2. Lire les pages data-flow existantes comme référence de structure :
   - `apps/docs/docs/architecture/data-flows/pilot-to-catalog.mdx` (flux principal)
   - `apps/docs/docs/architecture/data-flows/media-upload.mdx` (flux secondaire)
3. Créer le fichier MDX dans `apps/docs/docs/architecture/data-flows/`
4. Structurer la page selon le template data-flow (voir section Template ci-dessous)
5. Ajouter l'entrée dans `apps/docs/sidebars.ts` (catégorie "Flux de données")
6. Vérifier si le glossaire doit être mis à jour avec de nouveaux termes

## Workflow — Page Architecture

1. Identifier le sujet architectural à documenter
2. Lire `apps/docs/docs/architecture/overview.mdx` comme référence
3. Créer le fichier MDX dans `apps/docs/docs/architecture/`
4. Structurer avec flowchart Mermaid + Tabs composants + tableaux récapitulatifs
5. Ajouter l'entrée dans `apps/docs/sidebars.ts` (catégorie "Architecture")

## Workflow — Glossaire

1. Lire `apps/docs/docs/architecture/glossary.md`
2. Identifier la catégorie appropriée (Entités, Variantes, Statuts, Events, Infrastructure, Identifiants)
3. Ajouter l'entrée au format existant : `### Nom` + `**Définition**` + tableau/détails + lien fichier source
4. Maintenir l'ordre alphabétique au sein de chaque catégorie

## Rules & Conventions

### Frontmatter

Toujours inclure les 3 champs :

```yaml
---
sidebar_position: N
title: 'Titre en français'
description: 'Description courte en français'
---
```

### Langue

Toute la documentation est rédigée en **français**. Seuls les termes techniques anglais (DDD, CQRS, Effect, etc.) et les noms de code (PilotProduct, MediaId, etc.) restent en anglais.

### Imports

Toute page utilisant des Tabs commence par :

```tsx
import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
```

### Diagrammes Mermaid

- **Data flows** : `sequenceDiagram` avec `autonumber` et participants nommés
- **Cycles de vie** : `stateDiagram-v2`
- **Architecture** : `flowchart TB` ou `flowchart LR`
- Utiliser `rect rgb(...)` pour grouper les phases dans les séquences
- Utiliser `classDef` + `class` pour la coloration cohérente
- Palette de couleurs projet :
  - Primary (serveur) : `fill:#2e5d4e,stroke:#1f4139,color:#fff`
  - Secondary (consumers) : `fill:#5ba88a,stroke:#3c7962,color:#fff`
  - Storage : `fill:#f5f5f5,stroke:#333,color:#333`
  - Messaging : `fill:#ff9800,stroke:#e65100,color:#fff`
  - External : `fill:#2196f3,stroke:#0d47a1,color:#fff`

### Liens vers le code source

Format GitHub : `[nom-fichier.ts](https://github.com/maison-amane/maison-amane/blob/main/chemin/vers/fichier.ts)`

### Admonitions Docusaurus

Utiliser les admonitions pour les informations contextuelles :

```markdown
:::info Titre
Contenu informatif
:::

:::tip Titre
Conseil pratique
:::

:::note
Note complémentaire
:::
```

### Details (FAQ)

Pour les sections FAQ, utiliser les balises HTML :

```html
<details>
  <summary>Question ?</summary>
  Réponse détaillée.
</details>
```

### Sidebar

Toute nouvelle page doit être ajoutée dans `apps/docs/sidebars.ts`. Structure actuelle :

```
docsSidebar:
  - intro
  - Architecture (category, collapsed: false)
    - architecture/overview (link)
    - architecture/glossary
    - Flux de données (category, collapsed: false)
      - architecture/data-flows/pilot-to-catalog
      - architecture/data-flows/shopify-sync
      - architecture/data-flows/media-upload
      - architecture/data-flows/error-handling
```

## Template — Page Data Flow

Structure attendue pour une page data-flow :

```
1. Frontmatter YAML
2. Imports (Tabs, TabItem)
3. # Titre du flux
4. Paragraphe d'introduction (1-2 phrases, contexte + objectif)
5. ## Vue globale du flux
   - sequenceDiagram Mermaid (autonumber, participants, phases rect)
6. ## [Optionnel] Cycle de vie (si state machine)
   - stateDiagram-v2 + tableau des statuts
7. ## Étapes de transformation
   - Tableau | Étape | Source | Cible | Description |
8. ## Détails
   - <Tabs> avec un TabItem par étape clé
   - Chaque tab : code TypeScript, explication, lien fichier source
9. ## [Optionnel] Sections complémentaires
   - Intégration avec d'autres BC
   - Configuration
   - Monitoring / Métriques
   - FAQ (<details>)
10. Séparateur --- entre sections majeures
```

## Template — Entrée Glossaire

```markdown
### NomDuTerme

**Définition** : Description concise en une phrase.

Paragraphe d'explication plus détaillé si nécessaire.

| Champ/Statut | Description |
| ------------ | ----------- |
| `valeur1`    | Explication |
| `valeur2`    | Explication |

**Fichier source** : [`chemin/vers/fichier.ts`](lien-github)
```

## Reference Files

| Pattern                          | File                                                          |
| -------------------------------- | ------------------------------------------------------------- |
| Page data-flow (flux principal)  | `apps/docs/docs/architecture/data-flows/pilot-to-catalog.mdx` |
| Page data-flow (flux secondaire) | `apps/docs/docs/architecture/data-flows/media-upload.mdx`     |
| Page data-flow (erreurs)         | `apps/docs/docs/architecture/data-flows/error-handling.mdx`   |
| Page architecture                | `apps/docs/docs/architecture/overview.mdx`                    |
| Glossaire                        | `apps/docs/docs/architecture/glossary.md`                     |
| Sidebar config                   | `apps/docs/sidebars.ts`                                       |
| Docusaurus config                | `apps/docs/docusaurus.config.ts`                              |
| Introduction                     | `apps/docs/docs/intro.md`                                     |

## Quality Checklist

- [ ] Frontmatter complet (`sidebar_position`, `title`, `description`)
- [ ] Langue française (sauf termes techniques anglais)
- [ ] Diagramme Mermaid avec `autonumber` (sequenceDiagram)
- [ ] Palette de couleurs cohérente dans les diagrammes
- [ ] Tableau "Étapes de transformation" présent (pages data-flow)
- [ ] Tabs avec détails par étape et liens vers fichiers source
- [ ] Entrée ajoutée dans `sidebars.ts`
- [ ] Glossaire mis à jour si nouveaux termes métier introduits
- [ ] Pas de lien cassé (vérifier les références croisées)
- [ ] Page d'introduction (`intro.md`) mise à jour si nouvelle section ajoutée
