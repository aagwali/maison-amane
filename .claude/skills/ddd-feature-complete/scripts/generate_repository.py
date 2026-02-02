#!/usr/bin/env python3
"""
Generate a complete repository stack for an entity.

Usage:
    python generate_repository.py <entity_name> <context_name>

Example:
    python generate_repository.py Order order
    python generate_repository.py CatalogProduct catalog

Generates:
  1. ports/driven/repositories/{entity}.repository.ts (interface)
  2. infrastructure/persistence/mongodb/{entity}.repository.ts (impl)
  3. infrastructure/persistence/mongodb/mappers/{entity}.mapper.ts
  4. infrastructure/persistence/in-memory/{entity}.repository.ts (test double)
"""

import argparse
from pathlib import Path


def to_kebab_case(name: str) -> str:
    """Convert PascalCase to kebab-case."""
    result = []
    for i, char in enumerate(name):
        if char.isupper() and i > 0:
            result.append('-')
        result.append(char.lower())
    return ''.join(result)


def to_camel_case(name: str) -> str:
    """Convert PascalCase to camelCase."""
    return name[0].lower() + name[1:] if name else ''


def to_snake_case(name: str) -> str:
    """Convert PascalCase to snake_case."""
    result = []
    for i, char in enumerate(name):
        if char.isupper() and i > 0:
            result.append('_')
        result.append(char.lower())
    return ''.join(result)


def create_file(path: Path, content: str) -> None:
    """Create a file with content."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        print(f"  Skipped (exists): {path}")
        return
    path.write_text(content)
    print(f"  Created: {path}")


def generate_port(base_path: Path, entity: str, context: str) -> None:
    """Generate repository port interface."""
    kebab = to_kebab_case(entity)
    camel = to_camel_case(entity)

    content = f'''import {{ Context, Effect, Option }} from 'effect'

import type {{ {entity}, {entity}Id }} from '../../../domain/{context}'
import type {{ PersistenceError }} from '../errors'

// =============================================================================
// SERVICE INTERFACE
// =============================================================================

export interface {entity}RepositoryService {{
  readonly save: ({camel}: {entity}) => Effect.Effect<{entity}, PersistenceError>
  readonly findById: (id: {entity}Id) => Effect.Effect<Option.Option<{entity}>, PersistenceError>
  readonly update: ({camel}: {entity}) => Effect.Effect<{entity}, PersistenceError>
  readonly delete: (id: {entity}Id) => Effect.Effect<void, PersistenceError>
}}

// =============================================================================
// CONTEXT TAG
// =============================================================================

export class {entity}Repository extends Context.Tag('{entity}Repository')<
  {entity}Repository,
  {entity}RepositoryService
>() {{}}
'''

    create_file(base_path / "ports" / "driven" / "repositories" / f"{kebab}.repository.ts", content)


def generate_mongodb_repository(base_path: Path, entity: str, context: str) -> None:
    """Generate MongoDB repository implementation."""
    kebab = to_kebab_case(entity)
    camel = to_camel_case(entity)
    snake = to_snake_case(entity)

    content = f'''import {{ Effect, Layer, Option }} from 'effect'
import type {{ Collection }} from 'mongodb'

import {{ {entity}Repository }} from '../../../ports/driven'
import type {{ {entity}RepositoryService }} from '../../../ports/driven'
import {{ MongoDatabase }} from './mongo-database'
import {{
  {camel}FromDocument,
  {camel}ToDocument,
  type {entity}Document,
}} from './mappers/{kebab}.mapper'
import {{ tryMongoOperation }} from './base-repository'

const COLLECTION_NAME = '{snake}s'

// =============================================================================
// FACTORY
// =============================================================================

const createMongodb{entity}Repository = (
  collection: Collection<{entity}Document>
): {entity}RepositoryService => ({{
  save: ({camel}) =>
    tryMongoOperation(
      () => collection.insertOne({camel}ToDocument({camel}) as any),
      'insert',
      '{entity}'
    ).pipe(Effect.map(() => {camel})),

  findById: (id) =>
    tryMongoOperation(
      () => collection.findOne({{ _id: id }}),
      'find',
      '{entity}'
    ).pipe(
      Effect.map((doc) => (doc ? Option.some({camel}FromDocument(doc)) : Option.none()))
    ),

  update: ({camel}) =>
    tryMongoOperation(
      () => collection.replaceOne(
        {{ _id: {camel}.id }},
        {camel}ToDocument({camel}) as any
      ),
      'update',
      '{entity}'
    ).pipe(Effect.map(() => {camel})),

  delete: (id) =>
    tryMongoOperation(
      () => collection.deleteOne({{ _id: id }}),
      'delete',
      '{entity}'
    ).pipe(Effect.map(() => void 0)),
}})

// =============================================================================
// LAYER
// =============================================================================

export const Mongodb{entity}RepositoryLive = Layer.effect(
  {entity}Repository,
  Effect.map(MongoDatabase, (db) =>
    createMongodb{entity}Repository(db.collection(COLLECTION_NAME))
  )
)
'''

    create_file(base_path / "infrastructure" / "persistence" / "mongodb" / f"{kebab}.repository.ts", content)


def generate_mapper(base_path: Path, entity: str, context: str) -> None:
    """Generate domain-document mapper."""
    kebab = to_kebab_case(entity)
    camel = to_camel_case(entity)

    content = f'''import {{ Make{entity}, Make{entity}Id, type {entity} }} from '../../../../domain/{context}'

// =============================================================================
// DOCUMENT TYPE
// =============================================================================

export interface {entity}Document {{
  _id: string
  // TODO: Add document fields matching your aggregate
  createdAt: Date
  updatedAt: Date
}}

// =============================================================================
// DOMAIN -> DOCUMENT
// =============================================================================

export const {camel}ToDocument = ({camel}: {entity}): {entity}Document => ({{
  _id: {camel}.id,
  // TODO: Map domain properties to document
  createdAt: {camel}.createdAt,
  updatedAt: {camel}.updatedAt,
}})

// =============================================================================
// DOCUMENT -> DOMAIN
// =============================================================================

export const {camel}FromDocument = (doc: {entity}Document): {entity} =>
  Make{entity}({{
    id: Make{entity}Id(doc._id),
    // TODO: Map document properties to domain
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }})
'''

    create_file(base_path / "infrastructure" / "persistence" / "mongodb" / "mappers" / f"{kebab}.mapper.ts", content)


def generate_inmemory_repository(base_path: Path, entity: str, context: str) -> None:
    """Generate in-memory repository for testing."""
    kebab = to_kebab_case(entity)

    content = f'''import {{ Layer }} from 'effect'

import {{ {entity}Repository }} from '../../../ports/driven'
import type {{ {entity}, {entity}Id }} from '../../../domain/{context}'
import {{ createInMemoryRepository }} from './generic.repository'

// =============================================================================
// LAYER (for testing)
// =============================================================================

export const InMemory{entity}RepositoryLive = Layer.succeed(
  {entity}Repository,
  createInMemoryRepository<{entity}, {entity}Id>((entity) => entity.id)
)
'''

    create_file(base_path / "infrastructure" / "persistence" / "in-memory" / f"{kebab}.repository.ts", content)


def main():
    parser = argparse.ArgumentParser(
        description='Generate a complete repository stack'
    )
    parser.add_argument(
        'entity_name',
        help='Entity name in PascalCase (e.g., "Order", "CatalogProduct")'
    )
    parser.add_argument(
        'context_name',
        help='Bounded context name in kebab-case (e.g., "order", "catalog")'
    )
    parser.add_argument(
        '--base-path',
        default='apps/server/src',
        help='Base path for the server application'
    )

    args = parser.parse_args()

    entity = args.entity_name
    context = args.context_name.lower()
    base_path = Path(args.base_path)

    print(f"\n{'='*60}")
    print(f"  Generating Repository Stack for: {entity}")
    print(f"  Context: {context}")
    print(f"{'='*60}\n")

    print("Creating Port (Interface)...")
    generate_port(base_path, entity, context)

    print("\nCreating MongoDB Repository...")
    generate_mongodb_repository(base_path, entity, context)

    print("\nCreating Mapper...")
    generate_mapper(base_path, entity, context)

    print("\nCreating In-Memory Repository...")
    generate_inmemory_repository(base_path, entity, context)

    print(f"\n{'='*60}")
    print(f"  Repository stack for '{entity}' generated!")
    print(f"{'='*60}")
    print("\nRemember to:")
    print(f"  1. Update the mapper with actual fields")
    print(f"  2. Export from ports/driven/index.ts")
    print(f"  3. Add to composition layer")
    print("")


if __name__ == '__main__':
    main()
