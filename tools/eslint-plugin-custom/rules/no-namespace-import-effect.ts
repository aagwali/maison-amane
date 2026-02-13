import { ESLintUtils, TSESTree, AST_NODE_TYPES } from '@typescript-eslint/utils'

const createRule = ESLintUtils.RuleCreator(() => 'https://internal.dev/rule-doc')

export const noNamespaceImportEffect = createRule({
  name: 'no-namespace-import-effect',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer direct imports from "effect/Effect" over namespace access (Effect.gen → gen)',
    },
    fixable: 'code',
    schema: [],
    messages: {
      noNamespace:
        'Import "{{member}}" directly from "effect/Effect" instead of using Effect.{{member}}',
    },
  },
  defaultOptions: [],
  create: (context) => {
    let effectModuleImport: TSESTree.ImportDeclaration | null = null
    let effectBaseImport: TSESTree.ImportDeclaration | null = null
    const usedMembers = new Set<{ name: string; isType: boolean }>()
    const namespacedEffectUsages: (TSESTree.MemberExpression | TSESTree.TSQualifiedName)[] = []
    let hasDirectEffectUsage = false // Track if Effect is used directly (not as Effect.xxx)

    // Helper: Check if node is in type position
    const isInTypeContext = (node: TSESTree.Node): boolean => {
      let current: TSESTree.Node | undefined = node

      // Traverse up the tree to find type contexts
      while (current?.parent) {
        const parent: TSESTree.Node = current.parent

        if (
          parent.type === AST_NODE_TYPES.TSTypeReference ||
          parent.type === AST_NODE_TYPES.TSTypeAnnotation ||
          parent.type === AST_NODE_TYPES.TSTypeParameterInstantiation ||
          parent.type === AST_NODE_TYPES.TSTypeAliasDeclaration
        ) {
          return true
        }

        current = parent
      }

      return false
    }

    return {
      // First pass: find existing imports
      ImportDeclaration(node: TSESTree.ImportDeclaration) {
        if (node.source.value === 'effect/Effect') {
          effectModuleImport = node
        } else if (node.source.value === 'effect') {
          effectBaseImport = node
        }
      },

      // Track direct usages of Effect identifier (not Effect.xxx)
      'Identifier[name="Effect"]': (node: TSESTree.Identifier) => {
        const parent = node.parent

        // Skip if this is the import statement itself
        if (parent?.type === 'ImportSpecifier') return

        // Skip if this is part of Effect.xxx (we handle those separately)
        if (
          (parent?.type === 'MemberExpression' && parent.object === node) ||
          (parent?.type === 'TSQualifiedName' && parent.left === node)
        ) {
          return
        }

        // This is a direct usage of Effect (e.g., as a type parameter, variable, etc.)
        hasDirectEffectUsage = true
      },

      // Helper: shared fix logic
      'MemberExpression, TSQualifiedName': (
        node: TSESTree.MemberExpression | TSESTree.TSQualifiedName
      ) => {
        let leftName: string | null = null
        let rightName: string | null = null
        let isType = false

        // Handle MemberExpression (runtime code: Effect.gen)
        if (node.type === 'MemberExpression') {
          if (
            node.object.type !== 'Identifier' ||
            node.object.name !== 'Effect' ||
            node.property.type !== 'Identifier'
          ) {
            return
          }
          leftName = node.object.name
          rightName = (node.property as TSESTree.Identifier).name
          isType = isInTypeContext(node)
        }
        // Handle TSQualifiedName (type annotation: Effect.Effect<T>)
        else if (node.type === AST_NODE_TYPES.TSQualifiedName) {
          if (
            node.left.type !== 'Identifier' ||
            node.left.name !== 'Effect' ||
            node.right.type !== 'Identifier'
          ) {
            return
          }
          leftName = node.left.name
          // We already checked node.right.type === 'Identifier' above
          rightName = (node.right as TSESTree.Identifier).name
          isType = true // Always a type in TSQualifiedName
        }

        if (!leftName || !rightName) return

        const memberName = rightName
        usedMembers.add({ name: memberName, isType })
        namespacedEffectUsages.push(node)

        context.report({
          node,
          messageId: 'noNamespace',
          data: { member: memberName },
          fix: (fixer) => {
            const fixes = []

            // Fix 1: Replace Effect.Something with Something (or just Effect for Effect.Effect)
            const replacement = memberName === 'Effect' ? 'Effect' : memberName
            fixes.push(fixer.replaceText(node, replacement))

            // Fix 2: Remove Effect from base import if present
            if (effectBaseImport && memberName === 'Effect') {
              const effectSpecifier = effectBaseImport.specifiers.find(
                (spec) =>
                  spec.type === 'ImportSpecifier' &&
                  spec.imported.type === 'Identifier' &&
                  (spec.imported as TSESTree.Identifier).name === 'Effect'
              )

              if (effectSpecifier) {
                const remainingSpecifiers = effectBaseImport.specifiers
                  .filter(
                    (spec): spec is TSESTree.ImportSpecifier =>
                      spec.type === 'ImportSpecifier' && spec !== effectSpecifier
                  )
                  .map((spec) => (spec.imported as TSESTree.Identifier).name)

                if (remainingSpecifiers.length === 0) {
                  // Remove entire import if Effect was the only specifier
                  fixes.push(fixer.remove(effectBaseImport))
                } else {
                  // Rebuild import without Effect
                  const newImport = `import { ${remainingSpecifiers.join(', ')} } from 'effect'`
                  fixes.push(fixer.replaceText(effectBaseImport, newImport))
                }
              }
            }

            // Fix 3: Add to effect/Effect import
            if (effectModuleImport) {
              // Import exists, add member if not present
              const existingSpecifiers = effectModuleImport.specifiers.filter(
                (spec): spec is TSESTree.ImportSpecifier => spec.type === 'ImportSpecifier'
              )

              const alreadyImported = existingSpecifiers.some((spec) => {
                const importedName = spec.imported.type === 'Identifier' ? spec.imported.name : null
                return importedName === memberName
              })

              if (!alreadyImported) {
                const lastSpecifier =
                  effectModuleImport.specifiers[effectModuleImport.specifiers.length - 1]
                const importPrefix = isType ? 'type ' : ''
                fixes.push(fixer.insertTextAfter(lastSpecifier, `, ${importPrefix}${memberName}`))
              }
            } else {
              // No import yet, create one
              if (effectBaseImport) {
                const importPrefix = isType ? 'type ' : ''
                const newImport = `\nimport { ${importPrefix}${memberName} } from 'effect/Effect'`
                fixes.push(fixer.insertTextAfter(effectBaseImport, newImport))
              }
            }

            return fixes
          },
        })
      },

      // Cleanup: Remove unused Effect import from 'effect' after all fixes
      'Program:exit': () => {
        // Only cleanup if Effect is not used directly (only as Effect.xxx or not at all)
        if (!effectBaseImport || hasDirectEffectUsage) {
          return
        }

        // Check if Effect is imported from 'effect'
        const effectSpecifier = effectBaseImport.specifiers.find(
          (spec) =>
            spec.type === 'ImportSpecifier' &&
            spec.imported.type === 'Identifier' &&
            (spec.imported as TSESTree.Identifier).name === 'Effect'
        )

        if (!effectSpecifier) return

        // All Effect usages are Effect.xxx and will be replaced, so remove the import
        context.report({
          node: effectSpecifier,
          messageId: 'noNamespace',
          data: { member: 'Effect (unused after fixes)' },
          fix: (fixer) => {
            const remainingSpecifiers = effectBaseImport!.specifiers
              .filter(
                (spec): spec is TSESTree.ImportSpecifier =>
                  spec.type === 'ImportSpecifier' && spec !== effectSpecifier
              )
              .map((spec) => (spec.imported as TSESTree.Identifier).name)

            if (remainingSpecifiers.length === 0) {
              // Remove entire import if Effect was the only specifier
              return fixer.remove(effectBaseImport!)
            } else {
              // Rebuild import without Effect
              const newImport = `import { ${remainingSpecifiers.join(', ')} } from 'effect'`
              return fixer.replaceText(effectBaseImport!, newImport)
            }
          },
        })
      },
    }
  },
})
