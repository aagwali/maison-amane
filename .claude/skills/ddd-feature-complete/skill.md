---
name: ddd-feature-complete
description: |
  Orchestrateur principal pour créer une feature DDD complète avec architecture hexagonale Effect-TS.
  Utiliser quand: (1) Créer un nouveau bounded context, (2) Ajouter une feature complète (domain + application + infra + tests), (3) Scaffolder un nouveau module métier.
  Ce skill coordonne les autres skills et utilise des scripts de génération pour accélérer le développement.
---

# DDD Feature Complete - Orchestrateur

Point d'entrée principal pour le développement de features dans ce projet DDD/Hexagonal Effect-TS.

## Scripts disponibles

Exécuter depuis la racine du projet :

```bash
# Scaffolder un bounded context complet
python .claude/skills/ddd-feature-complete/scripts/scaffold_bounded_context.py <context_name>

# Générer un repository stack (port + impl + mapper + tests)
python .claude/skills/ddd-feature-complete/scripts/generate_repository.py <Entity> <context>

# Générer un handler avec tests
python .claude/skills/ddd-feature-complete/scripts/generate_handler.py <action> <Entity> <context> --type=command|query
```

## Workflow : Créer un Bounded Context

### Phase 1 : Scaffolding

```bash
python .claude/skills/ddd-feature-complete/scripts/scaffold_bounded_context.py order
```

Crée la structure complète :

```
domain/order/          → aggregate, value-objects, events, errors
application/order/     → commands, handlers, validation
ports/driven/         → repository interface
infrastructure/       → MongoDB + in-memory implementations
```

### Phase 2 : Domain Layer

Personnaliser le domaine. Pour les patterns détaillés, voir le skill **domain-modeling** :

1. **Aggregate** : Définir les propriétés dans `domain/{context}/aggregate.ts`
2. **Value Objects** : Ajouter les VOs dans `domain/{context}/value-objects/`
3. **Events** : Compléter `domain/{context}/events.ts`
4. **Errors** : Ajouter les erreurs métier dans `errors.ts`

### Phase 3 : Application Layer

Implémenter les use cases. Pour les patterns détaillés, voir le skill **application-use-cases** :

1. **Command DTO** : Compléter `application/{context}/commands/`
2. **Handler** : Implémenter la logique dans `handlers/`
3. **Validation** : Ajouter les schemas de transformation dans `validation/`

Générer des handlers supplémentaires :

```bash
python .claude/skills/ddd-feature-complete/scripts/generate_handler.py publish Order order --type=command
python .claude/skills/ddd-feature-complete/scripts/generate_handler.py get Order order --type=query
```

### Phase 4 : Infrastructure Layer

Connecter au monde extérieur. Pour les patterns détaillés, voir le skill **infrastructure-adapters** :

1. **Mapper** : Compléter `infrastructure/persistence/mongodb/mappers/{entity}.mapper.ts`
2. **Repository** : Vérifier l'implémentation MongoDB
3. **Layer** : Ajouter au layer de composition

### Phase 5 : Tests

Écrire les tests. Pour les patterns détaillés, voir le skill **testing-effect** :

1. Compléter les tests handlers générés
2. Ajouter les fixtures si nécessaire
3. Tester les cas d'erreur

### Phase 6 : Wiring

Connecter le nouveau contexte :

1. Exporter le repository dans `ports/driven/index.ts`
2. Ajouter le layer dans `composition/layers/`
3. Créer le HTTP handler si endpoint API nécessaire

## Checklist de complétion

- [ ] Aggregate avec `S.TaggedStruct` + `Data.case`
- [ ] Value objects avec branded types pour les IDs
- [ ] Events avec correlationId/userId/timestamp
- [ ] Erreurs typées `Data.TaggedError`
- [ ] Command handler avec signature Effect complète
- [ ] Validation schemas si transformation nécessaire
- [ ] Repository port + MongoDB impl + In-memory impl
- [ ] Mappers domain ↔ document
- [ ] Tests avec provideTestLayer()
- [ ] Exports dans tous les index.ts
- [ ] Layer de composition mis à jour

## Arbre de décision

```
Que voulez-vous faire ?
│
├─ Nouveau bounded context complet
│  └─ Exécuter scaffold_bounded_context.py
│
├─ Ajouter une entité à un contexte existant
│  ├─ Créer l'aggregate → voir domain-modeling
│  └─ Générer le repository → generate_repository.py
│
├─ Ajouter un use case
│  └─ Générer le handler → generate_handler.py
│
├─ Modéliser le domaine (aggregate, VO, event)
│  └─ Voir skill domain-modeling
│
├─ Créer handler/validation
│  └─ Voir skill application-use-cases
│
├─ Implémenter adapter (repo, publisher)
│  └─ Voir skill infrastructure-adapters
│
└─ Écrire des tests
   └─ Voir skill testing-effect
```

## Conventions de nommage

| Élément         | Convention                     | Exemple                             |
| --------------- | ------------------------------ | ----------------------------------- |
| Bounded context | kebab-case                     | `pilot`, `order`, `product-catalog` |
| Aggregate       | PascalCase                     | `PilotProduct`, `Order`             |
| Command         | `{Action}{Entity}Command`      | `CreateOrderCommand`                |
| Handler         | `handle{Action}{Entity}`       | `handleCreateOrder`                 |
| Repository      | `{Entity}Repository`           | `OrderRepository`                   |
| Layer           | `{Tech}{Entity}RepositoryLive` | `MongodbOrderRepositoryLive`        |
| Event           | `{Entity}{Action}` (passé)     | `OrderCreated`, `ProductPublished`  |
