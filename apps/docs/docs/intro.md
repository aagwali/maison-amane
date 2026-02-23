---
sidebar_position: 1
title: Introduction
description: Documentation technique et fonctionnelle de Maison Amane
---

# Documentation Maison Amane

Bienvenue dans la documentation technique et fonctionnelle du projet Maison Amane, une plateforme e-commerce pour la vente de tapis artisanaux.

## À propos de cette documentation

Cette documentation est destinée à plusieurs audiences :

| Audience           | Contenu recommandé                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Développeurs**   | [Vue d'ensemble](./architecture/overview), [Flux de données](./architecture/data-flows/pilot-to-catalog), [Architecture Client](./architecture/client/overview) |
| **Product Owners** | [Glossaire](./architecture/glossary), [Gestion des erreurs](./architecture/data-flows/error-handling)                                                           |
| **QA**             | [Glossaire](./architecture/glossary), [Gestion des erreurs](./architecture/data-flows/error-handling)                                                           |

## Architecture en bref

Maison Amane est construit sur les principes du **Domain-Driven Design** avec une architecture **event-driven** :

```
                    +-----------------+
                    |   HTTP API      |
                    |   (Server)      |
                    +--------+--------+
                             |
              +--------------+--------------+
              |                             |
     +--------v--------+           +--------v--------+
     |  PilotProduct   |           |     Media       |
     |  (Write Model)  |           |   (Upload)      |
     +--------+--------+           +-----------------+
              |
     +--------v--------+
     |   RabbitMQ      |
     |   (Events)      |
     +--------+--------+
              |
    +---------+---------+---------+
    |                   |         |
+---v-----+    +--------v--+  +--v----------+
| Catalog  |   |  Shopify  |  |   Media     |
| (Read)   |   |  (Sync)   |  | (Confirm)   |
+----------+   +-----------+  +-------------+
```

## Concepts clés

- **PilotProduct** : Source de vérité pour les informations produit
- **CatalogProduct** : Vue optimisée pour l'affichage client
- **Media** : Images uploadées sur CDN, confirmées par référence produit
- **Event Sourcing** : Les changements sont propagés via des événements
- **CQRS** : Séparation entre opérations d'écriture et de lecture

Pour une explication complète de ces concepts, consultez le [Glossaire](./architecture/glossary).

## Navigation rapide

- [Architecture](./architecture/overview) - Diagrammes et composants principaux
- [Glossaire](./architecture/glossary) - Définitions du langage métier
- [Pilot vers Catalog](./architecture/data-flows/pilot-to-catalog) - Projection vers le read model
- [Synchronisation Shopify](./architecture/data-flows/shopify-sync) - Intégration avec Shopify
- [Enregistrement Media](./architecture/data-flows/media-upload) - Upload d'images et confirmation
- [Gestion des erreurs](./architecture/data-flows/error-handling) - Mécanisme de retry et DLQ
- [Application Client](./architecture/client/overview) - Architecture et composants du back-office
- [Flux utilisateur](./architecture/client/data-flows) - Création, édition et upload d'images

## Stack technique

| Composant       | Technologie           |
| --------------- | --------------------- |
| Backend         | Node.js + Effect-TS   |
| API             | @effect/platform      |
| Frontend        | Next.js 16 + MUI 7    |
| Base de données | MongoDB               |
| Messaging       | RabbitMQ              |
| CDN Images      | Cloudinary            |
| E-commerce      | Shopify (intégration) |
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
│       ├── shopify-sync/
│       └── media-confirmation/
└── packages/
    ├── api/              # Contrats API partagés
    └── shared-kernel/    # Éléments partagés
```

## Contribution à la documentation

Cette documentation est maintenue en Markdown/MDX et versionnée avec le code source. Pour contribuer :

1. Les fichiers se trouvent dans `apps/docs/docs/`
2. Les diagrammes utilisent Mermaid (format textuel)
3. Les liens vers le code source suivent le format GitHub

Pour démarrer la documentation en local :

```bash
cd apps/docs
pnpm install
pnpm dev
```
