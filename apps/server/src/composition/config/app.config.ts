// src/composition/config/app.config.ts

import { Config } from 'effect'

// ============================================
// APPLICATION CONFIGURATION (typed & validated)
// ============================================

export const AppConfig = Config.all({
  // Server
  port: Config.number("PORT").pipe(Config.withDefault(3000)),
  nodeEnv: Config.literal("development", "production", "test")("NODE_ENV").pipe(
    Config.withDefault("development")
  ),

  // Logging
  logLevel: Config.literal("debug", "info", "warn", "error")("LOG_LEVEL").pipe(
    Config.withDefault("info")
  ),

  // MongoDB
  mongoUri: Config.string("MONGO_URI"),
  mongoDb: Config.string("MONGO_DB").pipe(Config.withDefault("maison_amane"))
})

// Inferred type from Config
export type AppConfig = Config.Config.Success<typeof AppConfig>
