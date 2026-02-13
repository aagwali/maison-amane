import { ESLintUtils, TSESTree } from '@typescript-eslint/utils'

const createRule = ESLintUtils.RuleCreator(() => 'https://internal.dev/rule-doc')

export const lineBeforePipe = createRule({
  name: 'line-before-pipe',
  meta: {
    type: 'layout',
    docs: {
      description: 'Force line break before .pipe() and proper closing parenthesis formatting',
    },
    fixable: 'code',
    schema: [],
    messages: {
      breakLine: 'Put .pipe() on a new line',
      noLineAfterPipe: 'No line break after .pipe(',
      closingParen: 'Closing ) should not be alone on a line',
    },
  },
  defaultOptions: [],
  create: (context) => ({
    CallExpression: (node: TSESTree.CallExpression) => {
      if (node.callee.type !== 'MemberExpression') return
      if (node.callee.property.type !== 'Identifier') return
      if (node.callee.property.name !== 'pipe') return

      const source = context.sourceCode
      const member = node.callee
      const object = member.object

      // Check 1: Force line break before .pipe
      const textBeforePipe = source.text.slice(object.range[1], member.property.range[0])

      if (!textBeforePipe.includes('\n')) {
        // Calculate correct indentation based on the line containing the object
        const lineStart = source.text.lastIndexOf('\n', object.range[0]) + 1
        const lineText = source.text.slice(lineStart, object.range[0])
        const currentIndent = lineText.match(/^(\s*)/)?.[1] || ''
        const newIndent = currentIndent + '  ' // Add 2 spaces

        context.report({
          node: member.property,
          messageId: 'breakLine',
          fix: (fixer) =>
            fixer.replaceTextRange([object.range[1], member.property.range[0]], `\n${newIndent}.`),
        })
        return // Fix one issue at a time
      }

      // Check 2: No line break after .pipe(
      const openParen = source.getTokenAfter(member.property)
      if (!openParen || openParen.value !== '(') return

      const firstArg = node.arguments[0]
      if (!firstArg) return

      const textAfterOpenParen = source.text.slice(openParen.range[1], firstArg.range[0])

      if (textAfterOpenParen.trim() === '' && textAfterOpenParen.includes('\n')) {
        context.report({
          node: openParen,
          messageId: 'noLineAfterPipe',
          fix: (fixer) => fixer.replaceTextRange([openParen.range[1], firstArg.range[0]], ''),
        })
        return // Fix one issue at a time
      }

      // Check 3: Closing ) should not be alone on a line
      const closeParen = source.getLastToken(node)
      if (!closeParen || closeParen.value !== ')') return

      const tokenBeforeClose = source.getTokenBefore(closeParen)
      if (!tokenBeforeClose) return

      const textBeforeCloseParen = source.text.slice(tokenBeforeClose.range[1], closeParen.range[0])

      // If there's only whitespace (including newlines) between last token and closing )
      if (textBeforeCloseParen.trim() === '' && textBeforeCloseParen.includes('\n')) {
        context.report({
          node: closeParen,
          messageId: 'closingParen',
          fix: (fixer) =>
            fixer.replaceTextRange([tokenBeforeClose.range[1], closeParen.range[0]], ''),
        })
      }
    },
  }),
})
