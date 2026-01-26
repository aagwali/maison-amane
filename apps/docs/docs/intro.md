---
sidebar_position: 1
title: Introduction
description: Documentation technique et fonctionnelle de Maison Amane
---

# Documentation Maison Amane

Bienvenue dans la documentation technique et fonctionnelle du projet Maison Amane, une plateforme e-commerce pour la vente de tapis artisanaux.

## A propos de cette documentation

Cette documentation est destinee a plusieurs audiences :

| Audience           | Contenu recommande                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| **Developpeurs**   | [Vue d'ensemble](./architecture/overview), [Flux de donnees](./architecture/data-flows/pilot-to-catalog) |
| **Product Owners** | [Glossaire](./architecture/glossary), [Gestion des erreurs](./architecture/data-flows/error-handling)    |
| **QA**             | [Glossaire](./architecture/glossary), [Gestion des erreurs](./architecture/data-flows/error-handling)    |

## Architecture en bref

Maison Amane est construit sur les principes du **Domain-Driven Design** avec une architecture **event-driven** :

```
                    +-----------------+
                    |   HTTP API      |
                    |   (Server)      |
                    +--------+--------+
                             |
                    +--------v--------+
                    |  PilotProduct   |
                    |  (Write Model)  |
                    +--------+--------+
                             |
                    +--------v--------+
                    |   RabbitMQ      |
                    |   (Events)      |
                    +--------+--------+
                             |
              +--------------+--------------+
              |                             |
     +--------v--------+           +--------v--------+
     | CatalogProduct  |           |    Shopify      |
     | (Read Model)    |           |    (Sync)       |
     +-----------------+           +-----------------+
```

## Concepts cles

- **PilotProduct** : Source de verite pour les informations produit
- **CatalogProduct** : Vue optimisee pour l'affichage client
- **Event Sourcing** : Les changements sont propages via des evenements
- **CQRS** : Separation entre operations d'ecriture et de lecture

Pour une explication complete de ces concepts, consultez le [Glossaire](./architecture/glossary).

## Navigation rapide

### Architecture

- [Vue d'ensemble](./architecture/overview) - Diagrammes et composants principaux
- [Glossaire](./architecture/glossary) - Definitions du langage metier

### Flux de donnees

- [Pilot vers Catalog](./architecture/data-flows/pilot-to-catalog) - Projection vers le read model
- [Synchronisation Shopify](./architecture/data-flows/shopify-sync) - Integration avec Shopify
- [Gestion des erreurs](./architecture/data-flows/error-handling) - Mecanisme de retry et DLQ

## Stack technique

| Composant       | Technologie           |
| --------------- | --------------------- |
| Backend         | Node.js + Effect-TS   |
| API             | @effect/platform      |
| Base de donnees | MongoDB               |
| Messaging       | RabbitMQ              |
| E-commerce      | Shopify (integration) |
| Monorepo        | pnpm + Turborepo      |

## Structure du projet

```
maison-amane/
├── apps/
│   ├── server/           # API HTTP + domaine
│   ├── client/           # Application front-end
│   ├── docs/             # Cette documentation
│   └── consumers/        # Consumers RabbitMQ
│       ├── catalog-projection/
│       └── shopify-sync/
└── packages/
    ├── api/              # Contrats API partages
    └── shared-kernel/    # Elements partages
```

## Contribution a la documentation

Cette documentation est maintenue en Markdown/MDX et versionnee avec le code source. Pour contribuer :

1. Les fichiers se trouvent dans `apps/docs/docs/`
2. Les diagrammes utilisent Mermaid (format textuel)
3. Les liens vers le code source suivent le format GitHub

Pour demarrer la documentation en local :

```bash
cd apps/docs
pnpm install
pnpm dev
```
