# Bounded Context — Complete Directory Structure

Template for a new bounded context `{context}` with aggregate `{entity}`.

```
apps/server/src/
├── domain/{context}/
│   ├── aggregate.ts                          # Root entity + methods
│   ├── value-objects/
│   │   ├── ids.ts                            # Branded IDs
│   │   ├── scalar-types.ts                   # Branded scalars
│   │   ├── {union-name}.ts                   # Tagged unions (if needed)
│   │   ├── {structured-vo}.ts                # Structured VOs (if needed)
│   │   └── index.ts                          # Barrel export
│   ├── events.ts                             # Domain events (versioned)
│   ├── errors.ts                             # Domain errors (TaggedError)
│   ├── enums.ts                              # Enumerations
│   ├── services/                             # Domain services (if needed)
│   │   ├── {service-name}.ts
│   │   └── index.ts
│   ├── reference-data.ts                     # Lookup tables (if needed)
│   └── index.ts                              # Barrel export
│
├── application/{context}/
│   ├── commands/
│   │   ├── create-{entity}.command.ts        # Create command DTO
│   │   ├── update-{entity}.command.ts        # Update command DTO
│   │   └── index.ts
│   ├── queries/
│   │   ├── get-{entity}.query.ts             # Query DTO (Data.case)
│   │   └── index.ts
│   ├── handlers/
│   │   ├── create-{entity}.handler.ts        # Create handler
│   │   ├── update-{entity}.handler.ts        # Update handler
│   │   ├── get-{entity}.handler.ts           # Query handler
│   │   ├── create-{entity}.handler.test.ts   # Integration test
│   │   ├── update-{entity}.handler.test.ts
│   │   ├── get-{entity}.handler.test.ts
│   │   └── index.ts
│   ├── validation/
│   │   ├── {entity}-data.schema.ts           # Create validation
│   │   ├── update-{entity}-data.schema.ts    # Update validation (Option fields)
│   │   └── index.ts
│   ├── mappers/
│   │   ├── {entity}.mapper.ts                # Validated → Domain mapper
│   │   └── index.ts
│   └── index.ts                              # Barrel export
│
├── ports/driven/repositories/
│   └── {entity}.repository.ts                # Port (Context.Tag)
│
├── infrastructure/
│   ├── persistence/
│   │   ├── mongodb/
│   │   │   ├── {entity}.repository.ts        # MongoDB implementation
│   │   │   └── mappers/
│   │   │       └── {entity}.mapper.ts        # Domain ↔ Document mapper
│   │   └── in-memory/
│   │       └── {entity}.repository.ts        # Test double
│   └── http/
│       ├── handlers/
│       │   └── {entity}.handler.ts           # HTTP handler
│       └── mappers/
│           └── {entity}-problem-detail.mapper.ts  # Error mapper
│
└── composition/layers/
    └── {context}.layer.ts                    # Wire all layers

packages/api/src/
├── routes.ts                                 # Add HttpApiGroup
├── endpoints.ts                              # Add endpoint paths
└── dtos/
    ├── {entity}.request.ts                   # Request DTOs
    ├── {entity}.response.ts                  # Response DTOs
    └── errors.ts                             # Add error DTOs if needed

apps/consumers/{context}-projection/          # Optional: if read model needed
├── src/
│   └── main.ts
├── package.json
└── tsconfig.json
```

## Existing Example: Pilot Context

Use the Pilot context as the reference implementation:

```
apps/server/src/domain/pilot/
apps/server/src/application/pilot/
apps/server/src/ports/driven/repositories/pilot-product.repository.ts
apps/server/src/infrastructure/persistence/mongodb/pilot-product.repository.ts
apps/server/src/infrastructure/persistence/in-memory/pilot-product.repository.ts
apps/server/src/infrastructure/http/handlers/pilot-product.handler.ts
packages/api/src/routes.ts (PilotProductGroup)
apps/consumers/catalog-projection/
```
