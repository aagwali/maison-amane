export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type enum - conventional commits standard
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation only changes
        'style', // Code style changes (formatting, missing semi-colons, etc)
        'refactor', // Code refactoring (neither fixes a bug nor adds a feature)
        'perf', // Performance improvements
        'test', // Adding or updating tests
        'build', // Changes to build system or dependencies
        'ci', // CI/CD configuration changes
        'chore', // Other changes that don't modify src or test files
        'revert', // Reverts a previous commit
      ],
    ],

    // Scope enum - based on monorepo structure
    // Allow custom scopes with warning instead of error
    'scope-enum': [
      1, // Warning level (not blocking)
      'always',
      [
        // Apps
        'server',
        'client',
        'catalog-projection',
        'shopify-sync',

        // Packages
        'api',
        'shared-kernel',

        // Special scopes
        'root', // For root-level changes (package.json, turbo.json, etc)
        'deps', // For dependency updates
        'release', // For release-related changes
        'monorepo', // For monorepo-wide changes
      ],
    ],

    // Scope is optional but recommended
    'scope-empty': [1, 'never'], // Warn if scope is empty

    // Subject rules
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],

    // Body rules
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],

    // Footer rules
    'footer-leading-blank': [2, 'always'],
  },
}
