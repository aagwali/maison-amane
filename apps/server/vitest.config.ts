// vitest.config.ts

import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // Use the same module system as the project
    environment: "node",

    // Colocated tests pattern
    include: ["src/**/*.test.ts"],

    // Coverage configuration (display only, no threshold)
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/test-utils/**",
        "src/main.ts",
        "src/infrastructure/http/**", // HTTP layer tested via integration
      ],
    },

    // Cleaner output
    reporters: ["verbose"],
  },
})
