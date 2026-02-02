#!/usr/bin/env python3
"""
Generate a command or query handler with tests.

Usage:
    python generate_handler.py <action> <entity> <context> [--type=command|query]

Example:
    python generate_handler.py create Order order --type=command
    python generate_handler.py get Order order --type=query
    python generate_handler.py publish PilotProduct pilot --type=command

Generates:
  - application/{context}/handlers/{action}-{entity}.handler.ts
  - application/{context}/handlers/{action}-{entity}.handler.test.ts
  - application/{context}/commands/{action}-{entity}.command.ts (if command)
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


def to_pascal_case(name: str) -> str:
    """Ensure PascalCase."""
    return name[0].upper() + name[1:] if name else ''


def create_file(path: Path, content: str) -> None:
    """Create a file with content."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        print(f"  Skipped (exists): {path}")
        return
    path.write_text(content)
    print(f"  Created: {path}")


def generate_command_dto(base_path: Path, action: str, entity: str, context: str) -> None:
    """Generate command DTO."""
    action_pascal = to_pascal_case(action)
    entity_kebab = to_kebab_case(entity)
    camel = to_camel_case(entity)

    content = f'''import {{ Data }} from 'effect'
import * as S from 'effect/Schema'

import {{ CorrelationIdSchema, UserIdSchema }} from '@maison-amane/shared-kernel'
import {{ {entity}IdSchema }} from '../../../domain/{context}'

// =============================================================================
// COMMAND DTO
// =============================================================================

export const {action_pascal}{entity}CommandSchema = S.TaggedStruct('{action_pascal}{entity}Command', {{
  {camel}Id: {entity}IdSchema,
  // TODO: Add command-specific fields
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
}})

export type {action_pascal}{entity}Command = typeof {action_pascal}{entity}CommandSchema.Type

export const Make{action_pascal}{entity}Command = (
  params: Omit<{action_pascal}{entity}Command, '_tag'>
): {action_pascal}{entity}Command =>
  Data.case<{action_pascal}{entity}Command>()({{ _tag: '{action_pascal}{entity}Command', ...params }})
'''

    create_file(
        base_path / "application" / context / "commands" / f"{action.lower()}-{entity_kebab}.command.ts",
        content
    )


def generate_command_handler(base_path: Path, action: str, entity: str, context: str) -> None:
    """Generate command handler."""
    action_pascal = to_pascal_case(action)
    action_lower = action.lower()
    entity_kebab = to_kebab_case(entity)
    camel = to_camel_case(entity)

    content = f'''import {{ Effect, Option }} from 'effect'

import {{
  type {entity},
  {entity}NotFound,
}} from '../../../domain/{context}'
import {{ {entity}Repository, Clock }} from '../../../ports/driven'
import type {{ {action_pascal}{entity}Command }} from '../commands'

// =============================================================================
// HANDLER
// =============================================================================

export const handle{action_pascal}{entity} = (
  command: {action_pascal}{entity}Command
): Effect.Effect<
  {entity},
  {entity}NotFound,
  {entity}Repository | Clock
> =>
  Effect.gen(function* () {{
    const repo = yield* {entity}Repository
    const clock = yield* Clock

    // 1. Fetch existing entity
    const maybe{entity} = yield* repo.findById(command.{camel}Id)
    const {camel} = yield* Option.match(maybe{entity}, {{
      onNone: () =>
        Effect.fail(new {entity}NotFound({{ id: String(command.{camel}Id) }})),
      onSome: Effect.succeed,
    }})

    // 2. Apply business logic
    const now = yield* clock.now()
    const updated = {{
      ...{camel},
      // TODO: Apply {action_lower} logic
      updatedAt: now,
    }}

    // 3. Persist
    return yield* repo.update(updated)
  }})
'''

    create_file(
        base_path / "application" / context / "handlers" / f"{action_lower}-{entity_kebab}.handler.ts",
        content
    )


def generate_query_handler(base_path: Path, action: str, entity: str, context: str) -> None:
    """Generate query handler."""
    action_pascal = to_pascal_case(action)
    action_lower = action.lower()
    entity_kebab = to_kebab_case(entity)
    camel = to_camel_case(entity)

    if action_lower == 'get':
        content = f'''import {{ Effect, Option }} from 'effect'

import {{ type {entity}, {entity}Id, {entity}NotFound }} from '../../../domain/{context}'
import {{ {entity}Repository }} from '../../../ports/driven'

// =============================================================================
// QUERY HANDLER: Get by ID
// =============================================================================

export const get{entity}ById = (
  id: {entity}Id
): Effect.Effect<{entity}, {entity}NotFound, {entity}Repository> =>
  Effect.gen(function* () {{
    const repo = yield* {entity}Repository
    const maybe{entity} = yield* repo.findById(id)

    return yield* Option.match(maybe{entity}, {{
      onNone: () => Effect.fail(new {entity}NotFound({{ id: String(id) }})),
      onSome: Effect.succeed,
    }})
  }})
'''
    elif action_lower == 'list':
        content = f'''import {{ Effect }} from 'effect'

import {{ type {entity} }} from '../../../domain/{context}'
import {{ {entity}Repository }} from '../../../ports/driven'

// =============================================================================
// QUERY HANDLER: List all
// =============================================================================

export const list{entity}s = (): Effect.Effect<
  readonly {entity}[],
  never,
  {entity}Repository
> =>
  Effect.gen(function* () {{
    const repo = yield* {entity}Repository
    return yield* repo.findAll()
  }})
'''
    else:
        content = f'''import {{ Effect }} from 'effect'

import {{ type {entity} }} from '../../../domain/{context}'
import {{ {entity}Repository }} from '../../../ports/driven'

// =============================================================================
// QUERY HANDLER: {action_pascal}
// =============================================================================

export const {action_lower}{entity} = (
  // TODO: Add query parameters
): Effect.Effect<{entity}, never, {entity}Repository> =>
  Effect.gen(function* () {{
    const repo = yield* {entity}Repository
    // TODO: Implement query logic
    throw new Error('Not implemented')
  }})
'''

    create_file(
        base_path / "application" / context / "queries" / f"{action_lower}-{entity_kebab}.query.ts",
        content
    )


def generate_handler_test(base_path: Path, action: str, entity: str, context: str, handler_type: str) -> None:
    """Generate handler test file."""
    action_pascal = to_pascal_case(action)
    action_lower = action.lower()
    entity_kebab = to_kebab_case(entity)
    camel = to_camel_case(entity)

    if handler_type == 'command':
        content = f'''import {{ Effect }} from 'effect'
import {{ beforeEach, describe, expect, it }} from 'vitest'

import {{ provideTestLayer, type TestContext }} from '../../../test-utils'
import {{ Make{action_pascal}{entity}Command }} from '../commands'
import {{ handle{action_pascal}{entity} }} from './{action_lower}-{entity_kebab}.handler'

describe('handle{action_pascal}{entity}', () => {{
  let testCtx: TestContext

  beforeEach(() => {{
    testCtx = provideTestLayer()
  }})

  describe('success cases', () => {{
    it.todo('{action_lower}s the {camel} successfully')
  }})

  describe('error cases', () => {{
    it('fails when {camel} not found', async () => {{
      const command = Make{action_pascal}{entity}Command({{
        {camel}Id: 'non-existent-id' as any,
        correlationId: 'test-correlation' as any,
        userId: 'test-user' as any,
        timestamp: new Date(),
      }})

      const result = await Effect.runPromise(
        handle{action_pascal}{entity}(command).pipe(
          Effect.either,
          Effect.provide(testCtx.layer)
        )
      )

      expect(result._tag).toBe('Left')
      if (result._tag === 'Left') {{
        expect(result.left._tag).toBe('{entity}NotFound')
      }}
    }})
  }})
}})
'''
    else:  # query
        content = f'''import {{ Effect }} from 'effect'
import {{ beforeEach, describe, expect, it }} from 'vitest'

import {{ provideTestLayer, type TestContext }} from '../../../test-utils'
import {{ {action_lower}{entity}{'ById' if action_lower == 'get' else 's'} }} from './{action_lower}-{entity_kebab}.query'

describe('{action_lower}{entity}{'ById' if action_lower == 'get' else 's'}', () => {{
  let testCtx: TestContext

  beforeEach(() => {{
    testCtx = provideTestLayer()
  }})

  describe('success cases', () => {{
    it.todo('returns {camel} when found')
  }})

  describe('error cases', () => {{
    it.todo('fails when {camel} not found')
  }})
}})
'''

    folder = "handlers" if handler_type == 'command' else "queries"
    create_file(
        base_path / "application" / context / folder / f"{action_lower}-{entity_kebab}.{'handler' if handler_type == 'command' else 'query'}.test.ts",
        content
    )


def main():
    parser = argparse.ArgumentParser(
        description='Generate a command or query handler with tests'
    )
    parser.add_argument(
        'action',
        help='Action name (e.g., "create", "publish", "get", "list")'
    )
    parser.add_argument(
        'entity',
        help='Entity name in PascalCase (e.g., "Order", "PilotProduct")'
    )
    parser.add_argument(
        'context',
        help='Bounded context name in kebab-case (e.g., "order", "pilot")'
    )
    parser.add_argument(
        '--type',
        choices=['command', 'query'],
        default='command',
        help='Handler type: command (write) or query (read)'
    )
    parser.add_argument(
        '--base-path',
        default='apps/server/src',
        help='Base path for the server application'
    )

    args = parser.parse_args()

    action = args.action
    entity = args.entity
    context = args.context.lower()
    handler_type = args.type
    base_path = Path(args.base_path)

    action_pascal = to_pascal_case(action)

    print(f"\n{'='*60}")
    print(f"  Generating {handler_type.upper()} Handler: {action_pascal}{entity}")
    print(f"  Context: {context}")
    print(f"{'='*60}\n")

    if handler_type == 'command':
        print("Creating Command DTO...")
        generate_command_dto(base_path, action, entity, context)

        print("\nCreating Command Handler...")
        generate_command_handler(base_path, action, entity, context)
    else:
        print("Creating Query Handler...")
        generate_query_handler(base_path, action, entity, context)

    print("\nCreating Handler Test...")
    generate_handler_test(base_path, action, entity, context, handler_type)

    print(f"\n{'='*60}")
    print(f"  Handler '{action_pascal}{entity}' generated!")
    print(f"{'='*60}")
    print("\nRemember to:")
    print(f"  1. Complete the handler logic")
    print(f"  2. Export from index.ts files")
    print(f"  3. Wire in HTTP handler if needed")
    print(f"  4. Implement the tests")
    print("")


if __name__ == '__main__':
    main()
