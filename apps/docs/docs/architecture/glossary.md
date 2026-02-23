---
sidebar_position: 2
title: Glossaire
description: Définitions du langage métier (Ubiquitous Language) utilisé dans Maison Amane
---

# Glossaire

Ce glossaire définit le vocabulaire métier commun à toutes les équipes (développeurs, PO, QA). Ces termes sont utilisés de manière cohérente dans le code source, la documentation et les échanges.

---

## Entités métier

### PilotProduct

**Définition** : Produit géré par l'équipe Pilote, représentant la source de vérité pour les informations produit.

Le PilotProduct est l'**agrégat racine** du domaine Pilot. Il contient toutes les informations nécessaires à la création et la gestion d'un produit : label, description, variantes, vues (images), et statut de synchronisation.

**Cycle de vie** :

1. Création en statut `DRAFT`
2. Publication (`PUBLISHED`) déclenchant les projections
3. Archivage (`ARCHIVED`) si nécessaire

**Fichier source** : [`apps/server/src/domain/pilot/aggregate.ts`](https://github.com/maison-amane/maison-amane/blob/main/apps/server/src/domain/pilot/aggregate.ts)

---

### CatalogProduct

**Définition** : Projection simplifiée d'un PilotProduct, optimisée pour l'affichage dans le catalogue client.

Le CatalogProduct est un **read model** dérivé du PilotProduct lors de sa publication. Il contient uniquement les informations nécessaires à l'affichage : pas de statut de synchronisation, structure d'images simplifiée.

**Caractéristiques** :

- Lecture seule (pas de modification directe)
- Mis à jour automatiquement lors de la publication d'un PilotProduct
- Optimisé pour les requêtes de consultation

**Fichier source** : [`apps/server/src/domain/catalog/projections/catalog-product.ts`](https://github.com/maison-amane/maison-amane/blob/main/apps/server/src/domain/catalog/projections/catalog-product.ts)

---

## Variantes

### Variant

**Définition** : Déclinaison d'un produit selon ses dimensions.

Chaque produit possède une ou plusieurs variantes. Une variante définit une taille disponible pour le produit.

### StandardVariant

**Définition** : Variante avec une taille prédéfinie dans le référentiel.

Les tailles standards sont :

- `REGULAR` : Dimensions standard selon la catégorie du produit
- `LARGE` : Dimensions plus grandes selon la catégorie

Le prix est déterminé automatiquement par la combinaison `PriceRange + Size`.

**Fichier source** : [`apps/server/src/domain/pilot/entities/variant.ts`](https://github.com/maison-amane/maison-amane/blob/main/apps/server/src/domain/pilot/entities/variant.ts)

### CustomVariant

**Définition** : Variante avec des dimensions personnalisées définies par le client.

Contrairement aux StandardVariant, les CustomVariant ont :

- Des dimensions spécifiques (largeur x longueur en cm)
- Un prix défini manuellement

**Fichier source** : [`apps/server/src/domain/pilot/entities/variant.ts`](https://github.com/maison-amane/maison-amane/blob/main/apps/server/src/domain/pilot/entities/variant.ts)

---

## Vues et images

### View

**Définition** : Image associée à un produit, identifiée par son type.

Chaque vue représente une photo du produit sous un angle ou contexte particulier. L'URL de l'image (`imageUrl`) référence un [Media](#media) préalablement enregistré.

### ViewType

Types de vues disponibles :

| Type       | Description                    | Obligatoire |
| ---------- | ------------------------------ | ----------- |
| `FRONT`    | Vue de face principale         | Oui         |
| `DETAIL`   | Vue de détail (texture, motif) | Oui         |
| `BACK`     | Vue de dos                     | Non         |
| `AMBIANCE` | Photo d'ambiance en situation  | Non         |

**Fichier source** : [`apps/server/src/domain/pilot/enums.ts`](https://github.com/maison-amane/maison-amane/blob/main/apps/server/src/domain/pilot/enums.ts)

---

## Media

### Media (agrégat)

**Définition** : Fichier media (image) enregistré dans le système, avec un cycle de vie à deux états.

Le Media est l'**agrégat racine** du bounded context Media. Il représente une image uploadée vers un CDN externe dont la référence est enregistrée dans le système. Le media est découplé des produits : ce sont les produits qui référencent les médias via les `imageUrl` de leurs views.

**Cycle de vie** :

1. Enregistrement en statut `PENDING` (via `POST /api/media`)
2. Confirmation automatique (`CONFIRMED`) quand un produit référence ce media

Voir [Flux d'enregistrement Media](./data-flows/media-upload) pour le flux complet.

**Fichier source** : [`apps/server/src/domain/media/aggregate.ts`](https://github.com/maison-amane/maison-amane/blob/main/apps/server/src/domain/media/aggregate.ts)

### MediaStatus

**Définition** : État du media dans son cycle de vie.

| Statut      | Description                                           |
| ----------- | ----------------------------------------------------- |
| `PENDING`   | Media enregistré, pas encore référencé par un produit |
| `CONFIRMED` | Media référencé par au moins un produit               |

### MediaUrl

**Définition** : URL du media sur le CDN externe (ex: Cloudinary, S3). Utilise le protocole `http://` en développement et `https://` en production.

---

## Statuts

### ProductStatus

**Définition** : État du produit dans son cycle de vie.

| Statut      | Description            | Déclencheur de projection |
| ----------- | ---------------------- | ------------------------- |
| `DRAFT`     | Brouillon, non visible | Non                       |
| `PUBLISHED` | Publié et visible      | Oui                       |
| `ARCHIVED`  | Archivé, non visible   | Non                       |

### SyncStatus

**Définition** : État de synchronisation avec Shopify.

| Statut       | Description                                                |
| ------------ | ---------------------------------------------------------- |
| `NotSynced`  | Non synchronisé (état initial)                             |
| `Synced`     | Synchronisation réussie, contient l'ID Shopify             |
| `SyncFailed` | Échec de synchronisation, contient les détails de l'erreur |

**Machine à états** :

```
NotSynced --> Synced (succès sync)
NotSynced --> SyncFailed (échec sync)
SyncFailed --> Synced (retry réussi)
SyncFailed --> SyncFailed (retry échoué)
```

**Fichier source** : [`apps/server/src/domain/pilot/value-objects/sync-status.ts`](https://github.com/maison-amane/maison-amane/blob/main/apps/server/src/domain/pilot/value-objects/sync-status.ts)

---

## Catégories et types

### ProductType

**Définition** : Type de produit commercialisé.

Actuellement : `TAPIS` (tapis artisanaux).

Extensible pour : `COUSSIN`, `PLAID`, etc.

### ProductCategory

**Définition** : Catégorie de produit, déterminant les dimensions de référence.

| Catégorie  | Description                            |
| ---------- | -------------------------------------- |
| `RUNNER`   | Tapis de couloir (format allongé)      |
| `STANDARD` | Tapis classique (format rectangulaire) |

### PriceRange

**Définition** : Gamme de prix du produit, influençant le tarif des variantes standards.

| Gamme      | Description      |
| ---------- | ---------------- |
| `DISCOUNT` | Entrée de gamme  |
| `STANDARD` | Gamme principale |
| `PREMIUM`  | Haut de gamme    |

---

## Événements

Tous les événements domaine portent le snapshot complet de l'agrégat (`product`), un `correlationId` de traçabilité, un `userId`, un `timestamp`, et une `_version`.

### PilotProductCreated

**Définition** : Événement émis à chaque création d'un PilotProduct, quel que soit son statut.

Cet événement déclenche la [confirmation des médias](./data-flows/media-upload) référencés par le produit (consumer `media-confirmation`).

### PilotProductPublished

**Définition** : Événement émis lors de la publication d'un PilotProduct (statut `PUBLISHED`).

Cet événement déclenche :

1. La projection vers CatalogProduct (consumer `catalog-projection`)
2. La synchronisation vers Shopify (consumer `shopify-sync`)

### PilotProductUpdated

**Définition** : Événement émis lors de toute mise à jour d'un PilotProduct existant, quel que soit son statut.

Cet événement déclenche la mise à jour des projections (catalog, shopify).

**Fichier source** : [`apps/server/src/domain/pilot/events.ts`](https://github.com/maison-amane/maison-amane/blob/main/apps/server/src/domain/pilot/events.ts)

---

## Infrastructure

### Consumer

**Définition** : Processus indépendant écoutant les événements RabbitMQ.

Trois consumers existent :

- `catalog-projection` : Projette les PilotProduct vers CatalogProduct
- `shopify-sync` : Synchronise les produits vers Shopify
- `media-confirmation` : Confirme les médias référencés par un produit nouvellement créé

### DLQ (Dead Letter Queue)

**Définition** : File d'attente pour les messages en échec après toutes les tentatives de retry.

Les messages en DLQ nécessitent une intervention manuelle ou une analyse. Voir [Gestion des erreurs](./data-flows/error-handling).

### Retry Queue

**Définition** : File d'attente temporaire pour les messages en attente de nouvelle tentative.

Les messages restent dans la retry queue pendant un délai (TTL) avant d'être retraités avec un backoff exponentiel.

---

## Application Client

### Server Action

**Définition** : Fonction Next.js exécutée côté serveur, appelée directement depuis un composant client.

Les Server Actions servent de pont entre l'UI et l'API du serveur. Elles sont marquées `'use server'` et peuvent être appelées comme des fonctions asynchrones ordinaires depuis les composants React. Elles gèrent également la conversion des erreurs Effect en objets `{ error: string }` lisibles par le client.

Trois Server Actions existent dans le back-office :

| Action            | API appelée                  | Description                           |
| ----------------- | ---------------------------- | ------------------------------------- |
| `createProduct()` | `POST /api/pilot-product`    | Crée un nouveau produit               |
| `updateProduct()` | `PUT /api/pilot-product/:id` | Met à jour un produit existant        |
| `registerMedia()` | `POST /api/media`            | Enregistre une image après upload CDN |

**Fichier source** : [`apps/client/src/app/products/actions.ts`](https://github.com/maison-amane/maison-amane/blob/main/apps/client/src/app/products/actions.ts)

---

### ProductFormContext

**Définition** : Context React gérant l'état du formulaire produit (mode create/edit, images, titre, détection de changements, sauvegarde).

Le `ProductFormContext` est le centre de coordination du formulaire produit. Il détecte automatiquement le mode (création ou édition) en fonction de la présence d'`initialData`, active la détection de changements en mode édition, et orchestre la sauvegarde via les Server Actions appropriées.

| Propriété clé   | Description                                                             |
| --------------- | ----------------------------------------------------------------------- |
| `mode`          | `'create'` ou `'edit'` — déterminé par la présence d'`initialData`      |
| `canSave`       | `true` si titre non vide + 2+ images + changements détectés (mode edit) |
| `saveProduct()` | Appelle `createProduct` ou `updateProduct` selon le mode                |

**Fichier source** : [`apps/client/src/contexts/ProductFormContext.tsx`](https://github.com/maison-amane/maison-amane/blob/main/apps/client/src/contexts/ProductFormContext.tsx)

---

### useImageUpload

**Définition** : Hook React basé sur Effect-TS gérant l'upload d'images vers Cloudinary et l'enregistrement via l'API media.

Le hook implémente un pipeline complet : validation des fichiers (type, taille), upload XHR vers Cloudinary avec suivi de progression, puis enregistrement via la Server Action `registerMedia`. Il expose l'état des uploads en cours (`uploadingImages`) et des uploads terminés (`uploadedImages`).

**Fichier source** : [`apps/client/src/hooks/useImageUpload.ts`](https://github.com/maison-amane/maison-amane/blob/main/apps/client/src/hooks/useImageUpload.ts)

---

## Identifiants

### ProductId

Identifiant unique d'un produit (UUID v4).

### MediaId

Identifiant unique d'un media (UUID v4).

### CorrelationId

Identifiant de traçabilité permettant de suivre une requête à travers tous les composants du système (API, consumers, logs).

### ShopifyProductId

Identifiant du produit dans Shopify, retourné après une synchronisation réussie.
