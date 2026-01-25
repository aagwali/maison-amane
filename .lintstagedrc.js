export default {
  // TypeScript and JavaScript files
  '**/*.{ts,tsx,js,jsx}': (filenames) => {
    const commands = [
      // 1. Format with Prettier
      `prettier --write ${filenames.join(' ')}`,

      // 2. Lint with ESLint and auto-fix
      `eslint --fix ${filenames.join(' ')}`,

      // 3. Type-check with TypeScript (using turbo for caching)
      'turbo run typecheck',

      // 4. Run related tests (using turbo for caching)
      'turbo run test',
    ]

    return commands
  },

  // JSON, Markdown, and other files - only format
  '**/*.{json,md,yaml,yml}': (filenames) => {
    return [`prettier --write ${filenames.join(' ')}`]
  },
}
