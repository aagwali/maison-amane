# Skills DDD/Hexagonal Architecture Effect-TS

Skills refactorisés pour le développement efficace avec DDD, Hexagonal Architecture et Effect-TS.

## 🎯 Point d'entrée principal

**[ddd-feature-complete](ddd-feature-complete/)** - Orchestrateur pour créer une feature complète

```bash
# Scaffolder un nouveau bounded context
python .claude/skills/ddd-feature-complete/scripts/scaffold_bounded_context.py order

# Générer un repository complet
python .claude/skills/ddd-feature-complete/scripts/generate_repository.py Order order

# Générer un handler
python .claude/skills/ddd-feature-complete/scripts/generate_handler.py create Order order --type=command
```

## 📚 Skills de référence

### [domain-modeling](domain-modeling/)

Modélisation du domaine (aggregates, value objects, events, state machines)

**Références détaillées :**

- [aggregates.md](domain-modeling/references/aggregates.md) - Aggregate roots avec S.TaggedStruct + Data.case
- [value-objects.md](domain-modeling/references/value-objects.md) - Branded types et unions discriminées
- [unions.md](domain-modeling/references/unions.md) - Unions discriminées avec \_tag
- [events.md](domain-modeling/references/events.md) - Domain events avec metadata
- [state-machines.md](domain-modeling/references/state-machines.md) - State machines pour transitions

### [application-use-cases](application-use-cases/)

Command/Query handlers avec Effect.gen et CQRS

**Références détaillées :**

- [command-handlers.md](application-use-cases/references/command-handlers.md) - Pattern complet avec Effect.gen
- [query-handlers.md](application-use-cases/references/query-handlers.md) - Get, List, Search patterns
- [validation-schemas.md](application-use-cases/references/validation-schemas.md) - S.transformOrFail
- [event-handlers.md](application-use-cases/references/event-handlers.md) - Projections et consumers

### [infrastructure-adapters](infrastructure-adapters/)

Repositories, adapters, et Layer composition

**Références détaillées :**

- [mongodb/repository.md](infrastructure-adapters/references/mongodb/repository.md) - MongoDB repositories
- [mongodb/mapper.md](infrastructure-adapters/references/mongodb/mapper.md) - Domain ↔ Document mappers
- [rabbitmq/publisher.md](infrastructure-adapters/references/rabbitmq/publisher.md) - Event publisher
- [testing/in-memory.md](infrastructure-adapters/references/testing/in-memory.md) - In-memory pour tests

### [testing-effect](testing-effect/)

Tests d'intégration avec Effect TestLayer

**Références détaillées :**

- [integration-testing.md](testing-effect/references/integration-testing.md) - Tests handlers complets
- [test-doubles.md](testing-effect/references/test-doubles.md) - Stubs, spies, test layer
- [fixtures.md](testing-effect/references/fixtures.md) - Builders et données de test

## 🛠️ Skills spécialisés

### [ast-grep-effect](ast-grep-effect/)

Recherche et refactorisation de patterns Effect-TS avec ast-grep

**Utilisation :**

- Refactoring à grande échelle de patterns Effect (Schema, Context.Tag, Layer)
- Recherche de tous les usages d'un pattern spécifique (TaggedStruct, Data.case, yield\*)
- Migration de patterns Effect (renommer schemas, changer signatures)
- Analyse de cohérence architecturale (aggregates, handlers, repositories)

### [effect-to-spring-vavr](effect-to-spring-vavr/)

Migration de projets Effect-TS vers Java 21 Spring Boot + Vavr

**Utilisation :**

- Conversion de codebase Effect-TS DDD/Hexagonal vers Java
- Préservation du railway-oriented programming (Either)
- Génération de structure Gradle multi-modules
- Mapping des patterns Effect vers Vavr + Spring

### [spring-boot-tooling](spring-boot-tooling/)

Configuration tooling production-ready pour Spring Boot

**Utilisation :**

- Logging structuré avec correlation IDs
- Code quality (Spotless, Checkstyle, SpotBugs)
- RFC 7807 error handling standardisé
- Spring Actuator health checks
- OpenAPI/Swagger documentation

### [skill-creator](skill-creator/)

Guide pour créer et maintenir des skills Claude Code

**Utilisation :**

- Créer un nouveau skill avec la bonne structure
- Appliquer les best practices de skill design
- Implémenter progressive disclosure
- Organiser la documentation et les références

## 🚀 Workflows typiques

### Créer un nouveau bounded context complet

```bash
# 1. Scaffolder la structure
python .claude/skills/ddd-feature-complete/scripts/scaffold_bounded_context.py payment

# 2. Personnaliser le domaine (voir domain-modeling)
# 3. Implémenter les handlers (voir application-use-cases)
# 4. Compléter l'infra (voir infrastructure-adapters)
# 5. Écrire les tests (voir testing-effect)
```

### Ajouter une entité à un contexte existant

```bash
# Générer le repository stack complet
python .claude/skills/ddd-feature-complete/scripts/generate_repository.py PaymentMethod payment
```

### Ajouter un use case

```bash
# Générer le handler avec tests
python .claude/skills/ddd-feature-complete/scripts/generate_handler.py process Payment payment --type=command
```

## 📁 Structure des skills

```
.claude/skills/
├── README.md                          ← Vous êtes ici
│
├── ddd-feature-complete/              ← 🎯 POINT D'ENTRÉE
│   ├── skill.md                       (orchestrateur)
│   └── scripts/
│       ├── scaffold_bounded_context.py
│       ├── generate_repository.py
│       └── generate_handler.py
│
├── domain-modeling/
│   ├── skill.md                       (arbre de décision)
│   └── references/
│       ├── aggregates.md
│       ├── value-objects.md
│       ├── unions.md
│       ├── events.md
│       └── state-machines.md
│
├── application-use-cases/
│   ├── skill.md                       (command vs query)
│   └── references/
│       ├── command-handlers.md
│       ├── query-handlers.md
│       ├── validation-schemas.md
│       └── event-handlers.md
│
├── infrastructure-adapters/
│   ├── skill.md                       (ports & adapters)
│   └── references/
│       ├── mongodb/
│       ├── rabbitmq/
│       └── testing/
│
└── testing-effect/
    ├── skill.md                       (test strategy)
    └── references/
        ├── integration-testing.md
        ├── test-doubles.md
        └── fixtures.md
```

## 🎓 Conventions de nommage

| Élément         | Convention                     | Exemple                      |
| --------------- | ------------------------------ | ---------------------------- |
| Bounded context | kebab-case                     | `pilot`, `order`, `payment`  |
| Aggregate       | PascalCase                     | `PilotProduct`, `Order`      |
| Command         | `{Action}{Entity}Command`      | `CreateOrderCommand`         |
| Handler         | `handle{Action}{Entity}`       | `handleCreateOrder`          |
| Repository      | `{Entity}Repository`           | `OrderRepository`            |
| Layer           | `{Tech}{Entity}RepositoryLive` | `MongodbOrderRepositoryLive` |
| Event           | `{Entity}{Action}` (passé)     | `OrderCreated`               |

## 🤝 Contribution

Pour ajouter un nouveau pattern ou améliorer un skill existant :

1. Ajouter le pattern dans la référence appropriée
2. Mettre à jour le skill.md principal avec un lien
3. Tester le pattern sur un cas réel
4. Documenter avec un exemple complet

## 📝 Licence

Ces skills sont spécifiques au projet Maison Amane et suivent les patterns établis dans la codebase.
