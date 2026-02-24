# Tour Templates

Parcours-types pour la visite guidée. Chaque template définit une progression de jalons.
Adapter le nombre d'étapes selon la profondeur choisie (survol → 3 premiers jalons, standard → tous, deep-dive → tous + sous-étapes).

---

## Architecture

Progression : macro → micro → flow complet.

| #   | Jalon                     | Contenu clé                                                   | Fichiers d'ancrage            |
| --- | ------------------------- | ------------------------------------------------------------- | ----------------------------- |
| 1   | Vision d'ensemble         | Monorepo turbo+pnpm, apps et packages                         | `CLAUDE.md`, racine du projet |
| 2   | Architecture hexagonale   | Couches Domain → Ports → Application → Infra → Composition    | `CONTEXT.md` §1-2             |
| 3   | Bounded Contexts          | Pilot (write), Catalog (read), Media, Shopify (integration)   | `apps/server/src/` par BC     |
| 4   | Patterns DDD              | Aggregates, Value Objects, Events versionnés, branded types   | Exemples dans Pilot           |
| 5   | CQRS & Handlers           | Command vs Query, validation 3 niveaux                        | Un handler concret            |
| 6   | Communication inter-BC    | Events, RabbitMQ, consumers, fire-and-forget vs choreography  | ADR-7, consumers              |
| 7   | Décisions architecturales | ADRs clés (6-9) : pas de driving ports, shared-kernel, events | `CONTEXT.md` ADRs             |
| 8   | Un flow de bout en bout   | Création produit : API → Handler → Domain → Event → Consumer  | Tracer le flow réel           |

---

## Contributeur

Progression : environnement → structure → workflow → skills → exercice.

| #   | Jalon                       | Contenu clé                                                         | Fichiers d'ancrage                |
| --- | --------------------------- | ------------------------------------------------------------------- | --------------------------------- |
| 1   | Setup & commandes           | pnpm, turbo, dev/build/test/typecheck                               | `CLAUDE.md` commands              |
| 2   | Structure du monorepo       | apps/, packages/, rôle de chaque workspace                          | `ls` racine                       |
| 3   | Conventions de code         | Naming, imports Effect, fichiers, commits                           | `CLAUDE.md` conventions           |
| 4   | Workflow d'ajout de feature | Domain → Application → Infra → Composition → Tests                  | `CLAUDE.md` §Development Workflow |
| 5   | Les Skills Claude           | Generate (domain-model, use-case, etc.) et leur utilisation         | `.claude/skills/`                 |
| 6   | Exemple concret             | Tracer une feature existante (ex: création produit) étape par étape | Code réel                         |
| 7   | Exercice suggéré            | Proposer un petit ajout guidé adapté au niveau                      | Contextuel                        |

---

## BC Spécifique

Progression : rôle du BC → domain model → handlers → infra → tests.
Adapter au BC demandé (Pilot, Catalog, Media, Shopify).

| #   | Jalon                  | Contenu clé                                           |
| --- | ---------------------- | ----------------------------------------------------- |
| 1   | Rôle et responsabilité | Pourquoi ce BC existe, quel problème métier il résout |
| 2   | Modèle de domaine      | Aggregate, Value Objects, états, events               |
| 3   | Cas d'usage            | Handlers (commands/queries), validation               |
| 4   | Infrastructure         | Repository MongoDB, messaging, layers                 |
| 5   | Tests                  | Structure des tests, fixtures, test doubles           |
| 6   | Interactions           | Comment ce BC communique avec les autres              |

---

## Vulgarisé

Progression : métier → problème → solution → comment ça marche (sans code).

| #   | Jalon                  | Contenu clé                                                       |
| --- | ---------------------- | ----------------------------------------------------------------- |
| 1   | Le métier              | Maison Amane = tapis sur mesure, e-commerce artisanal             |
| 2   | Le problème            | Gérer les produits configurables, les photos, la synchro boutique |
| 3   | La solution            | Application back-office pour le pilotage des produits             |
| 4   | L'organisation du code | Métaphore : départements d'une entreprise (BC = services)         |
| 5   | Les flux               | Comment une fiche produit naît et arrive en boutique              |
| 6   | La qualité             | Tests automatiques, documentation vivante, architecture évolutive |

---

## Combinaisons courantes

| Profil                | Parcours principal       | Complément suggéré            |
| --------------------- | ------------------------ | ----------------------------- |
| Dev senior DDD        | Architecture             | BC spécifique ou Contributeur |
| Dev backend classique | Architecture (simplifié) | Contributeur                  |
| Dev frontend          | Vulgarisé + zoom API     | BC Pilot (focus DTOs)         |
| Non-technique         | Vulgarisé                | —                             |
| Nouveau contributeur  | Contributeur             | Architecture                  |
