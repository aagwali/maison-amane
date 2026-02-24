---
name: onboarding
description: >
  Visite guidée interactive du projet Maison Amane, adaptée au profil du visiteur.
  Utiliser quand: (1) Quelqu'un veut comprendre le projet, (2) Onboarder un nouveau développeur,
  (3) Expliquer l'architecture, (4) Présenter le projet à un non-technique,
  (5) Découvrir un bounded context, (6) Comprendre comment contribuer,
  (7) Understand the project, (8) Explore the codebase, (9) Get onboarded,
  (10) Learn how to contribute, (11) Explain this project to me.
---

# Onboarding — Visite Guidée Interactive

Guider un visiteur à travers le projet Maison Amane via une conversation structurée.
Le parcours s'adapte au profil, aux objectifs et au niveau technique du visiteur.

## Principe

Être concis et didactique. Provoquer les questions plutôt que surcharger d'informations.
Chaque étape doit justifier sa présence. Le visiteur doit repartir avec une carte mentale claire.

## Ressources de navigation

Ces fichiers forment la base de navigation — les considérer à jour et les combiner
avec des recherches ciblées (Glob, Grep, Read) pour enrichir dynamiquement la visite.

| Ressource                   | Rôle                                                           | Quand lire                             |
| --------------------------- | -------------------------------------------------------------- | -------------------------------------- |
| `CLAUDE.md`                 | Vue d'ensemble, commandes, conventions                         | Toujours (déjà en contexte)            |
| `CONTEXT.md`                | Patterns détaillés, ADRs, exemples de code                     | Deep-dive architecture ou contributeur |
| `apps/docs/`                | Documentation Docusaurus (architecture, data-flows, glossaire) | Parcours architecture ou BC spécifique |
| `.claude/skills/*/SKILL.md` | Workflows des skills disponibles                               | Parcours contributeur                  |

## Phase 1 — Interview

L'objectif est d'obtenir 3 informations avant de passer à la stratégie.
L'échange est conversationnel : poser les questions naturellement, relancer si besoin,
regrouper ou séparer les questions selon le contexte. Ne pas forcer un bloc rigide.

### Informations à recueillir

**Profil technique** (comment calibrer le vocabulaire)

- Dev Effect-TS / DDD — connaît les patterns, veut les détails d'implémentation
- Dev backend classique — connaît REST/DB, découvre Effect et DDD
- Dev frontend / fullstack — focus client, veut comprendre l'API qu'il consomme
- Non-technique — veut comprendre le projet sans jargon

**Objectif** (quel parcours choisir)

- Comprendre l'architecture — vision macro, décisions, patterns
- Contribuer au code — workflow dev, skills, ajouter une feature
- Explorer un domaine — zoom sur un bounded context spécifique
- Évaluer le projet — survol rapide, stack, qualité

**Profondeur** (combien d'étapes)

- Survol (5-10 min) — ~3 étapes, concepts clés uniquement
- Tour standard (15-20 min) — ~6 étapes, liens vers le code
- Deep-dive (30+ min) — ~10+ étapes, code détaillé, ADRs

### Conseils de conduite

- Si le visiteur se présente spontanément ("je suis dev React, je veux contribuer"),
  en déduire les réponses implicites et ne poser que les questions restantes
- Si le contexte est clair dès le premier message, passer directement à la Phase 2
- Confirmer la compréhension avant de lancer la visite ("Donc on part sur X, ça te va ?")

## Phase 2 — Stratégie

Après l'interview :

1. Déterminer le parcours-type principal (voir `references/tour-templates.md`)
2. Combiner avec un second parcours si les réponses le justifient
3. Calibrer le vocabulaire (jargon DDD vs métaphores simples)
4. Produire le **sommaire navigable** — la carte de la visite

### Format du sommaire

```
## Votre parcours : [Titre]

| # | Jalon | Thème |
|---|-------|-------|
| 1 | ...   | ...   |
| 2 | ...   | ...   |
| N | ...   | ...   |

→ On commence ?
```

## Phase 3 — Visite guidée

### Format de chaque étape

```
## Étape N/M — [Titre du jalon]

[Explication concise — 2-3 phrases max, ton naturel]

Fichiers clés :
- [fichier.ts](chemin/relatif) — rôle en une phrase

Point à retenir : [concept clé résumé en une phrase]

→ Prêt pour la suite ? (ou posez une question)
```

### Règles pendant la visite

- **Croiser statique et dynamique** : utiliser Glob/Grep/Read pour montrer le code réel,
  mais toujours croiser avec les ressources statiques (CLAUDE.md, CONTEXT.md).
  Les BC ne vivent pas tous dans `apps/server/src/domain/` — certains (ex: Shopify)
  n'existent que comme consumers dans `apps/consumers/`. Se fier au filesystem seul
  peut donner une vue incomplète
- **Liens cliquables** : toujours utiliser le format `[fichier.ts](chemin)` ou `[fichier.ts:42](chemin#L42)`
- **Récapitulatif glissant** : tous les 3-4 étapes, résumer les jalons vus en une ligne chacun
- **Questions complémentaires** : répondre immédiatement, puis inviter à reprendre
  ("Bonne question ! [réponse]. On reprend à l'étape N ?")
- **Adapter en cours de route** : si le visiteur pose des questions avancées, accélérer ;
  s'il semble perdu, ralentir et reformuler

### Calibrage du vocabulaire

| Profil                | Style                                                                        |
| --------------------- | ---------------------------------------------------------------------------- |
| Dev Effect-TS / DDD   | Termes techniques directs, montrer les types et signatures                   |
| Dev backend classique | Analogies avec patterns connus (Repository = DAO, Effect = async/await typé) |
| Dev frontend          | Focus sur les contrats API, les DTOs, les server actions                     |
| Non-technique         | Métaphores concrètes, focus sur le "pourquoi" business, pas de code          |

## Phase 4 — Clôture

À la fin du parcours :

1. **Récapitulatif final** : liste des jalons avec les points à retenir
2. **Proposition de suite** : suggérer un parcours complémentaire si pertinent
   (ex: après Architecture → proposer Contributeur ; après BC Pilot → proposer BC Media)
3. **Ressources pour aller plus loin** : pointer vers la doc Docusaurus, CONTEXT.md,
   ou les skills pertinents selon le profil
4. **Invitation ouverte** : "Des questions sur ce qu'on a vu ?"
