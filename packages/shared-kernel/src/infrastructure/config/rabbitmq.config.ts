// packages/shared-kernel/src/infrastructure/config/rabbitmq.config.ts

import { Config, Context, Layer, Redacted } from 'effect'
import { withDefault } from 'effect/Config'

// ============================================
// RABBITMQ CONFIGURATION
// ============================================

export interface RabbitMQConfigValue {
  readonly url: Redacted.Redacted<string>
  readonly retry: {
    readonly maxAttempts: number
    readonly initialDelayMs: number
    readonly multiplier: number
  }
  readonly handlerTimeoutMs: number
}

export class RabbitMQConfig extends Context.Tag('RabbitMQConfig')<
  RabbitMQConfig,
  RabbitMQConfigValue
>() {}

export const rabbitmqConfigFromEnv = Config.all({
  url: Config.redacted('RABBITMQ_URL'),
  retry: Config.all({
    maxAttempts: Config.number('RABBITMQ_RETRY_MAX_ATTEMPTS')
      .pipe(withDefault(3)),
    initialDelayMs: Config.number('RABBITMQ_RETRY_INITIAL_DELAY_MS')
      .pipe(withDefault(1000)),
    multiplier: Config.number('RABBITMQ_RETRY_MULTIPLIER')
      .pipe(withDefault(5)),
  }),
  handlerTimeoutMs: Config.number('RABBITMQ_HANDLER_TIMEOUT_MS')
    .pipe(withDefault(30000)),
})

export const RabbitMQConfigLive = Layer.effect(RabbitMQConfig, rabbitmqConfigFromEnv)
