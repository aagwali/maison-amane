export default {
  // TypeScript and JavaScript files
  '**/*.{ts,tsx,js,jsx}': (filenames) => {
    // Escape filenames for shell (handles spaces and special chars)
    const escapeFilename = (filename) => `"${filename.replace(/"/g, '\\"')}"`
    const escapedFiles = filenames.map(escapeFilename).join(' ')

    const commands = [
      // 1. Format with Prettier
      `prettier --write ${escapedFiles}`,

      // 2. Lint with ESLint and auto-fix
      `eslint --fix ${escapedFiles}`,

      // 3. Type-check with TypeScript (using turbo for caching)
      'turbo run typecheck',

      // 4. Run related tests (using turbo for caching)
      'turbo run test',
    ]

    return commands
  },

  // JSON, Markdown, and other files - only format
  '**/*.{json,md,yaml,yml}': (filenames) => {
    const escapeFilename = (filename) => `"${filename.replace(/"/g, '\\"')}"`
    const escapedFiles = filenames.map(escapeFilename).join(' ')
    return [`prettier --write ${escapedFiles}`]
  },
}
