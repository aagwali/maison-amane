---
sidebar_position: 2
title: Glossaire
description: Definitions du langage metier (Ubiquitous Language) utilise dans Maison Amane
---

# Glossaire

Ce glossaire definit le vocabulaire metier commun a toutes les equipes (developpeurs, PO, QA). Ces termes sont utilises de maniere coherente dans le code source, la documentation et les echanges.

---

## Entites metier

### PilotProduct

**Definition** : Produit gere par l'equipe Pilote, representant la source de verite pour les informations produit.

Le PilotProduct est l'**agregat racine** du domaine Pilot. Il contient toutes les informations necessaires a la creation et la gestion d'un produit : label, description, variantes, vues (images), et statut de synchronisation.

**Cycle de vie** :

1. Creation en statut `DRAFT`
2. Publication (`PUBLISHED`) declenchant les projections
3. Archivage (`ARCHIVED`) si necessaire

**Fichier source** : [`apps/server/src/domain/pilot/aggregate.ts`](https://github.com/maison-amane/maison-amane/blob/main/apps/server/src/domain/pilot/aggregate.ts)

---

### CatalogProduct

**Definition** : Projection simplifiee d'un PilotProduct, optimisee pour l'affichage dans le catalogue client.

Le CatalogProduct est un **read model** derive du PilotProduct lors de sa publication. Il contient uniquement les informations necessaires a l'affichage : pas de statut de synchronisation, structure d'images simplifiee.

**Caracteristiques** :

- Lecture seule (pas de modification directe)
- Mis a jour automatiquement lors de la publication d'un PilotProduct
- Optimise pour les requetes de consultation

**Fichier source** : [`apps/server/src/domain/catalog/projections/catalog-product.ts`](https://github.com/maison-amane/maison-amane/blob/main/apps/server/src/domain/catalog/projections/catalog-product.ts)

---

## Variantes

### Variant

**Definition** : Declinaison d'un produit selon ses dimensions.

Chaque produit possede une ou plusieurs variantes. Une variante definit une taille disponible pour le produit.

### StandardVariant

**Definition** : Variante avec une taille predefinies dans le referentiel.

Les tailles standards sont :

- `REGULAR` : Dimensions standard selon la categorie du produit
- `LARGE` : Dimensions plus grandes selon la categorie

Le prix est determine automatiquement par la combinaison `PriceRange + Size`.

**Fichier source** : [`apps/server/src/domain/pilot/entities/variant.ts`](https://github.com/maison-amane/maison-amane/blob/main/apps/server/src/domain/pilot/entities/variant.ts)

### CustomVariant

**Definition** : Variante avec des dimensions personnalisees definies par le client.

Contrairement aux StandardVariant, les CustomVariant ont :

- Des dimensions specifiques (largeur x longueur en cm)
- Un prix defini manuellement

**Fichier source** : [`apps/server/src/domain/pilot/entities/variant.ts`](https://github.com/maison-amane/maison-amane/blob/main/apps/server/src/domain/pilot/entities/variant.ts)

---

## Vues et images

### View

**Definition** : Image associee a un produit, identifiee par son type.

Chaque vue represente une photo du produit sous un angle ou contexte particulier.

### ViewType

Types de vues disponibles :

| Type       | Description                    | Obligatoire |
| ---------- | ------------------------------ | ----------- |
| `FRONT`    | Vue de face principale         | Oui         |
| `DETAIL`   | Vue de detail (texture, motif) | Oui         |
| `BACK`     | Vue de dos                     | Non         |
| `AMBIANCE` | Photo d'ambiance en situation  | Non         |

**Fichier source** : [`apps/server/src/domain/pilot/enums.ts`](https://github.com/maison-amane/maison-amane/blob/main/apps/server/src/domain/pilot/enums.ts)

---

## Statuts

### ProductStatus

**Definition** : Etat du produit dans son cycle de vie.

| Statut      | Description            | Declencheur de projection |
| ----------- | ---------------------- | ------------------------- |
| `DRAFT`     | Brouillon, non visible | Non                       |
| `PUBLISHED` | Publie et visible      | Oui                       |
| `ARCHIVED`  | Archive, non visible   | Non                       |

### SyncStatus

**Definition** : Etat de synchronisation avec Shopify.

| Statut       | Description                                                |
| ------------ | ---------------------------------------------------------- |
| `NotSynced`  | Non synchronise (etat initial)                             |
| `Synced`     | Synchronisation reussie, contient l'ID Shopify             |
| `SyncFailed` | Echec de synchronisation, contient les details de l'erreur |

**Machine a etats** :

```
NotSynced --> Synced (succes sync)
NotSynced --> SyncFailed (echec sync)
SyncFailed --> Synced (retry reussi)
SyncFailed --> SyncFailed (retry echoue)
```

**Fichier source** : [`apps/server/src/domain/pilot/value-objects/sync-status.ts`](https://github.com/maison-amane/maison-amane/blob/main/apps/server/src/domain/pilot/value-objects/sync-status.ts)

---

## Categories et types

### ProductType

**Definition** : Type de produit commercialise.

Actuellement : `TAPIS` (tapis artisanaux).

Extensible pour : `COUSSIN`, `PLAID`, etc.

### ProductCategory

**Definition** : Categorie de produit, determinant les dimensions de reference.

| Categorie  | Description                            |
| ---------- | -------------------------------------- |
| `RUNNER`   | Tapis de couloir (format allonge)      |
| `STANDARD` | Tapis classique (format rectangulaire) |

### PriceRange

**Definition** : Gamme de prix du produit, influencant le tarif des variantes standards.

| Gamme      | Description      |
| ---------- | ---------------- |
| `DISCOUNT` | Entree de gamme  |
| `STANDARD` | Gamme principale |
| `PREMIUM`  | Haut de gamme    |

---

## Evenements

### PilotProductPublished

**Definition** : Evenement emis lors de la publication d'un PilotProduct.

Cet evenement declenche :

1. La projection vers CatalogProduct (consumer `catalog-projection`)
2. La synchronisation vers Shopify (consumer `shopify-sync`)

**Contenu** :

- `productId` : Identifiant du produit
- `product` : Donnees completes du PilotProduct
- `correlationId` : Identifiant de tracabilite
- `userId` : Utilisateur ayant declenche la publication
- `timestamp` : Date/heure de l'evenement

**Fichier source** : [`apps/server/src/domain/pilot/events.ts`](https://github.com/maison-amane/maison-amane/blob/main/apps/server/src/domain/pilot/events.ts)

### PilotProductSynced

**Definition** : Evenement emis apres une synchronisation reussie avec Shopify.

**Contenu** :

- `productId` : Identifiant du produit
- `shopifyProductId` : Identifiant retourne par Shopify
- `correlationId` : Identifiant de tracabilite
- `timestamp` : Date/heure de la synchronisation

---

## Infrastructure

### Consumer

**Definition** : Processus independant ecoutant les evenements RabbitMQ.

Deux consumers existent :

- `catalog-projection` : Projette les PilotProduct vers CatalogProduct
- `shopify-sync` : Synchronise les produits vers Shopify

### DLQ (Dead Letter Queue)

**Definition** : File d'attente pour les messages en echec apres toutes les tentatives de retry.

Les messages en DLQ necessitent une intervention manuelle ou une analyse. Voir [Gestion des erreurs](./data-flows/error-handling).

### Retry Queue

**Definition** : File d'attente temporaire pour les messages en attente de nouvelle tentative.

Les messages restent dans la retry queue pendant un delai (TTL) avant d'etre retraites avec un backoff exponentiel.

---

## Identifiants

### ProductId

Identifiant unique d'un produit (UUID v4).

### CorrelationId

Identifiant de tracabilite permettant de suivre une requete a travers tous les composants du systeme (API, consumers, logs).

### ShopifyProductId

Identifiant du produit dans Shopify, retourne apres une synchronisation reussie.
