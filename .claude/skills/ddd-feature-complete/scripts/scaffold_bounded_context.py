#!/usr/bin/env python3
"""
Scaffold a new DDD Bounded Context with Hexagonal Architecture.

Usage:
    python scaffold_bounded_context.py <context_name> [--type=write|read]

Example:
    python scaffold_bounded_context.py order --type=write
    python scaffold_bounded_context.py product-catalog --type=read

Creates the complete directory structure for a new bounded context:
- domain/{context}/ - Domain layer (aggregate, value objects, events, errors)
- application/{context}/ - Application layer (commands, handlers, validation)
- ports/driven/repositories/ - Repository interface
- infrastructure/persistence/mongodb/ - MongoDB implementation
- infrastructure/persistence/in-memory/ - Test implementation
"""

import argparse
import os
from pathlib import Path
from datetime import datetime


def to_pascal_case(name: str) -> str:
    """Convert kebab-case or snake_case to PascalCase."""
    return ''.join(word.capitalize() for word in name.replace('-', '_').split('_'))


def to_camel_case(name: str) -> str:
    """Convert kebab-case or snake_case to camelCase."""
    pascal = to_pascal_case(name)
    return pascal[0].lower() + pascal[1:] if pascal else ''


def create_file(path: Path, content: str) -> None:
    """Create a file with content, creating parent directories if needed."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    print(f"  Created: {path}")


def scaffold_domain_layer(base_path: Path, context: str, pascal: str) -> None:
    """Create domain layer files."""
    domain_path = base_path / "domain" / context

    # aggregate.ts
    create_file(domain_path / "aggregate.ts", f'''import {{ Data }} from 'effect'
import * as S from 'effect/Schema'

import {{ {pascal}IdSchema }} from './value-objects'
// import {{ {pascal}StatusSchema }} from './enums'

// =============================================================================
// AGGREGATE SCHEMA
// =============================================================================

const {pascal}Schema = S.TaggedStruct('{pascal}', {{
  id: {pascal}IdSchema,
  // TODO: Add aggregate properties
  createdAt: S.Date,
  updatedAt: S.Date,
}})

export type {pascal} = typeof {pascal}Schema.Type

// =============================================================================
// CONSTRUCTOR
// =============================================================================

export const Make{pascal} = (params: Omit<{pascal}, '_tag'>): {pascal} =>
  Data.case<{pascal}>()({{ _tag: '{pascal}', ...params }})
''')

    # value-objects/ids.ts
    create_file(domain_path / "value-objects" / "ids.ts", f'''import * as S from 'effect/Schema'

// =============================================================================
// {pascal.upper()} ID
// =============================================================================

export const {pascal}IdSchema = S.String.pipe(S.brand('{pascal}Id'))
export type {pascal}Id = typeof {pascal}IdSchema.Type

export const Make{pascal}Id = S.decodeUnknownSync({pascal}IdSchema)
''')

    # value-objects/index.ts
    create_file(domain_path / "value-objects" / "index.ts", '''export * from './ids'
''')

    # events.ts
    create_file(domain_path / "events.ts", f'''import {{ Data }} from 'effect'
import * as S from 'effect/Schema'

import {{ CorrelationIdSchema, UserIdSchema }} from '@maison-amane/shared-kernel'
import {{ {pascal}IdSchema }} from './value-objects'

// =============================================================================
// {pascal.upper()} CREATED EVENT
// =============================================================================

const {pascal}CreatedSchema = S.TaggedStruct('{pascal}Created', {{
  {to_camel_case(context)}Id: {pascal}IdSchema,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
}})

export type {pascal}Created = typeof {pascal}CreatedSchema.Type

export const Make{pascal}Created = (params: Omit<{pascal}Created, '_tag'>): {pascal}Created =>
  Data.case<{pascal}Created>()({{ _tag: '{pascal}Created', ...params }})

// =============================================================================
// DOMAIN EVENTS UNION
// =============================================================================

export type {pascal}DomainEvent = {pascal}Created
''')

    # errors.ts
    create_file(domain_path / "errors.ts", f'''import {{ Data }} from 'effect'
import type {{ ParseError }} from 'effect/ParseResult'

// =============================================================================
// VALIDATION ERROR
// =============================================================================

export class {pascal}ValidationError extends Data.TaggedError('{pascal}ValidationError')<{{
  readonly cause: ParseError
}}> {{}}

// =============================================================================
// NOT FOUND ERROR
// =============================================================================

export class {pascal}NotFound extends Data.TaggedError('{pascal}NotFound')<{{
  readonly id: string
}}> {{}}

// =============================================================================
// ERROR UNION
// =============================================================================

export type {pascal}Error = {pascal}ValidationError | {pascal}NotFound
''')

    # enums.ts
    create_file(domain_path / "enums.ts", f'''import * as S from 'effect/Schema'

// =============================================================================
// {pascal.upper()} STATUS
// =============================================================================

export enum {pascal}Status {{
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}}

export const {pascal}StatusSchema = S.Enums({pascal}Status)
''')

    # index.ts
    create_file(domain_path / "index.ts", '''export * from './aggregate'
export * from './value-objects'
export * from './events'
export * from './errors'
export * from './enums'
''')


def scaffold_application_layer(base_path: Path, context: str, pascal: str) -> None:
    """Create application layer files."""
    app_path = base_path / "application" / context

    # commands/create-{context}.command.ts
    create_file(app_path / "commands" / f"create-{context}.command.ts", f'''import {{ Data }} from 'effect'
import * as S from 'effect/Schema'

import {{ CorrelationIdSchema, UserIdSchema }} from '@maison-amane/shared-kernel'

// =============================================================================
// UNVALIDATED INPUT (from API)
// =============================================================================

export const Unvalidated{pascal}DataSchema = S.Struct({{
  // TODO: Add unvalidated input fields (strings, raw types)
}})

export type Unvalidated{pascal}Data = typeof Unvalidated{pascal}DataSchema.Type

// =============================================================================
// COMMAND DTO
// =============================================================================

export const Create{pascal}CommandSchema = S.TaggedStruct('Create{pascal}Command', {{
  data: Unvalidated{pascal}DataSchema,
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
}})

export type Create{pascal}Command = typeof Create{pascal}CommandSchema.Type

export const MakeCreate{pascal}Command = (
  params: Omit<Create{pascal}Command, '_tag'>
): Create{pascal}Command =>
  Data.case<Create{pascal}Command>()({{ _tag: 'Create{pascal}Command', ...params }})
''')

    # commands/index.ts
    create_file(app_path / "commands" / "index.ts", f'''export * from './create-{context}.command'
''')

    # handlers/create-{context}.handler.ts
    create_file(app_path / "handlers" / f"create-{context}.handler.ts", f'''import {{ Effect }} from 'effect'

import {{
  Make{pascal},
  type {pascal},
  type {pascal}Error,
}} from '../../domain/{context}'
import {{ {pascal}Repository }} from '../../ports/driven'
import {{ Clock, IdGenerator }} from '../../ports/driven'
import type {{ Create{pascal}Command }} from '../commands'

// =============================================================================
// HANDLER
// =============================================================================

export const handleCreate{pascal} = (
  command: Create{pascal}Command
): Effect.Effect<
  {pascal},
  {pascal}Error,
  {pascal}Repository | IdGenerator | Clock
> =>
  Effect.gen(function* () {{
    const repo = yield* {pascal}Repository
    const idGen = yield* IdGenerator
    const clock = yield* Clock

    // 1. Generate ID
    const id = yield* idGen.generate{pascal}Id()
    const now = yield* clock.now()

    // 2. Create aggregate
    const {to_camel_case(context)} = Make{pascal}({{
      id,
      // TODO: Map command.data fields to aggregate
      createdAt: now,
      updatedAt: now,
    }})

    // 3. Persist
    const saved = yield* repo.save({to_camel_case(context)})

    return saved
  }})
''')

    # handlers/index.ts
    create_file(app_path / "handlers" / "index.ts", f'''export * from './create-{context}.handler'
''')

    # validation/index.ts
    create_file(app_path / "validation" / "index.ts", '''// TODO: Add validation schemas (S.transformOrFail)
''')

    # index.ts
    create_file(app_path / "index.ts", '''export * from './commands'
export * from './handlers'
export * from './validation'
''')


def scaffold_ports(base_path: Path, context: str, pascal: str) -> None:
    """Create port interface files."""
    ports_path = base_path / "ports" / "driven" / "repositories"

    # Check if file already exists to avoid overwriting
    repo_file = ports_path / f"{context}.repository.ts"
    if not repo_file.exists():
        create_file(repo_file, f'''import {{ Context, Effect, Option }} from 'effect'

import type {{ {pascal}, {pascal}Id }} from '../../domain/{context}'
import type {{ PersistenceError }} from '../errors'

// =============================================================================
// SERVICE INTERFACE
// =============================================================================

export interface {pascal}RepositoryService {{
  readonly save: ({to_camel_case(context)}: {pascal}) => Effect.Effect<{pascal}, PersistenceError>
  readonly findById: (id: {pascal}Id) => Effect.Effect<Option.Option<{pascal}>, PersistenceError>
  readonly update: ({to_camel_case(context)}: {pascal}) => Effect.Effect<{pascal}, PersistenceError>
}}

// =============================================================================
// CONTEXT TAG
// =============================================================================

export class {pascal}Repository extends Context.Tag('{pascal}Repository')<
  {pascal}Repository,
  {pascal}RepositoryService
>() {{}}
''')
    else:
        print(f"  Skipped (exists): {repo_file}")


def scaffold_infrastructure(base_path: Path, context: str, pascal: str) -> None:
    """Create infrastructure layer files."""

    # MongoDB repository
    mongo_path = base_path / "infrastructure" / "persistence" / "mongodb"

    create_file(mongo_path / f"{context}.repository.ts", f'''import {{ Effect, Layer, Option }} from 'effect'
import type {{ Collection }} from 'mongodb'

import {{ {pascal}Repository }} from '../../../ports/driven'
import type {{ {pascal}RepositoryService }} from '../../../ports/driven'
import {{ MongoDatabase }} from './mongo-database'
import {{
  {to_camel_case(context)}FromDocument,
  {to_camel_case(context)}ToDocument,
  type {pascal}Document,
}} from './mappers/{context}.mapper'
import {{ tryMongoOperation }} from './base-repository'

const COLLECTION_NAME = '{context.replace("-", "_")}s'

// =============================================================================
// FACTORY
// =============================================================================

const createMongodb{pascal}Repository = (
  collection: Collection<{pascal}Document>
): {pascal}RepositoryService => ({{
  save: ({to_camel_case(context)}) =>
    tryMongoOperation(
      () => collection.insertOne({to_camel_case(context)}ToDocument({to_camel_case(context)}) as any),
      'insert',
      '{pascal}'
    ).pipe(Effect.map(() => {to_camel_case(context)})),

  findById: (id) =>
    tryMongoOperation(
      () => collection.findOne({{ _id: id }}),
      'find',
      '{pascal}'
    ).pipe(
      Effect.map((doc) => (doc ? Option.some({to_camel_case(context)}FromDocument(doc)) : Option.none()))
    ),

  update: ({to_camel_case(context)}) =>
    tryMongoOperation(
      () => collection.replaceOne(
        {{ _id: {to_camel_case(context)}.id }},
        {to_camel_case(context)}ToDocument({to_camel_case(context)}) as any
      ),
      'update',
      '{pascal}'
    ).pipe(Effect.map(() => {to_camel_case(context)})),
}})

// =============================================================================
// LAYER
// =============================================================================

export const Mongodb{pascal}RepositoryLive = Layer.effect(
  {pascal}Repository,
  Effect.map(MongoDatabase, (db) =>
    createMongodb{pascal}Repository(db.collection(COLLECTION_NAME))
  )
)
''')

    # Mapper
    create_file(mongo_path / "mappers" / f"{context}.mapper.ts", f'''import {{ Make{pascal}, Make{pascal}Id, type {pascal} }} from '../../../../domain/{context}'

// =============================================================================
// DOCUMENT TYPE
// =============================================================================

export interface {pascal}Document {{
  _id: string
  // TODO: Add document fields
  createdAt: Date
  updatedAt: Date
}}

// =============================================================================
// DOMAIN -> DOCUMENT
// =============================================================================

export const {to_camel_case(context)}ToDocument = ({to_camel_case(context)}: {pascal}): {pascal}Document => ({{
  _id: {to_camel_case(context)}.id,
  // TODO: Map domain fields to document
  createdAt: {to_camel_case(context)}.createdAt,
  updatedAt: {to_camel_case(context)}.updatedAt,
}})

// =============================================================================
// DOCUMENT -> DOMAIN
// =============================================================================

export const {to_camel_case(context)}FromDocument = (doc: {pascal}Document): {pascal} =>
  Make{pascal}({{
    id: Make{pascal}Id(doc._id),
    // TODO: Map document fields to domain
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }})
''')

    # In-memory repository
    inmem_path = base_path / "infrastructure" / "persistence" / "in-memory"

    create_file(inmem_path / f"{context}.repository.ts", f'''import {{ Layer }} from 'effect'

import {{ {pascal}Repository }} from '../../../ports/driven'
import type {{ {pascal}, {pascal}Id }} from '../../../domain/{context}'
import {{ createInMemoryRepository }} from './generic.repository'

// =============================================================================
// LAYER
// =============================================================================

export const InMemory{pascal}RepositoryLive = Layer.succeed(
  {pascal}Repository,
  createInMemoryRepository<{pascal}, {pascal}Id>((entity) => entity.id)
)
''')


def scaffold_tests(base_path: Path, context: str, pascal: str) -> None:
    """Create test file template."""
    test_path = base_path / "application" / context / "handlers"

    create_file(test_path / f"create-{context}.handler.test.ts", f'''import {{ Effect }} from 'effect'
import {{ beforeEach, describe, expect, it }} from 'vitest'

import {{ provideTestLayer, type TestContext }} from '../../../test-utils'
import {{ MakeCreate{pascal}Command }} from '../commands'
import {{ handleCreate{pascal} }} from './create-{context}.handler'

describe('handleCreate{pascal}', () => {{
  let testCtx: TestContext

  beforeEach(() => {{
    testCtx = provideTestLayer()
  }})

  describe('success cases', () => {{
    it('creates a {context} with deterministic ID', async () => {{
      const command = MakeCreate{pascal}Command({{
        data: {{}},
        correlationId: 'test-correlation' as any,
        userId: 'test-user' as any,
        timestamp: new Date(),
      }})

      const result = await Effect.runPromise(
        handleCreate{pascal}(command).pipe(Effect.provide(testCtx.layer))
      )

      expect(result.id).toBe('test-{context}-1')
    }})
  }})

  describe('error cases', () => {{
    it.todo('fails with validation error for invalid data')
  }})
}})
''')


def main():
    parser = argparse.ArgumentParser(
        description='Scaffold a new DDD Bounded Context'
    )
    parser.add_argument(
        'context_name',
        help='Name of the bounded context (kebab-case, e.g., "order" or "product-catalog")'
    )
    parser.add_argument(
        '--type',
        choices=['write', 'read'],
        default='write',
        help='Type of model: write (mutations) or read (projections)'
    )
    parser.add_argument(
        '--base-path',
        default='apps/server/src',
        help='Base path for the server application'
    )

    args = parser.parse_args()

    context = args.context_name.lower()
    pascal = to_pascal_case(context)
    base_path = Path(args.base_path)

    print(f"\n{'='*60}")
    print(f"  Scaffolding Bounded Context: {pascal}")
    print(f"  Type: {args.type.upper()} MODEL")
    print(f"{'='*60}\n")

    print("Creating Domain Layer...")
    scaffold_domain_layer(base_path, context, pascal)

    print("\nCreating Application Layer...")
    scaffold_application_layer(base_path, context, pascal)

    print("\nCreating Ports (Interfaces)...")
    scaffold_ports(base_path, context, pascal)

    print("\nCreating Infrastructure Layer...")
    scaffold_infrastructure(base_path, context, pascal)

    print("\nCreating Tests...")
    scaffold_tests(base_path, context, pascal)

    print(f"\n{'='*60}")
    print(f"  Bounded Context '{pascal}' scaffolded successfully!")
    print(f"{'='*60}")
    print("\nNext steps:")
    print(f"  1. Define aggregate properties in domain/{context}/aggregate.ts")
    print(f"  2. Add value objects in domain/{context}/value-objects/")
    print(f"  3. Update command DTO in application/{context}/commands/")
    print(f"  4. Implement handler logic in application/{context}/handlers/")
    print(f"  5. Update mappers in infrastructure/persistence/mongodb/mappers/")
    print(f"  6. Add repository export in ports/driven/index.ts")
    print(f"  7. Wire layer in composition/layers/")
    print("")


if __name__ == '__main__':
    main()
