// src/composition/config/app.config.ts

import { Config } from 'effect'

// ============================================
// APPLICATION CONFIGURATION (typed & validated)
// ============================================
// MongoDB → MongoConfigLive (@maison-amane/shared-kernel)
// Logging → BootstrapConfig + createLoggerLayer (@maison-amane/shared-kernel)

export const AppConfig = Config.all({
  port: Config.number('PORT')
    .pipe(Config.withDefault(3001)),
})

export type AppConfig = Config.Config.Success<typeof AppConfig>
