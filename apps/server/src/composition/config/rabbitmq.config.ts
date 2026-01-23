// src/composition/config/rabbitmq.config.ts

import { Config, Context, Layer, Redacted } from 'effect'

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
}

export class RabbitMQConfig extends Context.Tag("RabbitMQConfig")<
  RabbitMQConfig,
  RabbitMQConfigValue
>() {}

const rabbitmqConfigFromEnv = Config.all({
  url: Config.redacted("RABBITMQ_URL"),
  retry: Config.all({
    maxAttempts: Config.number("RABBITMQ_RETRY_MAX_ATTEMPTS").pipe(
      Config.withDefault(3)
    ),
    initialDelayMs: Config.number("RABBITMQ_RETRY_INITIAL_DELAY_MS").pipe(
      Config.withDefault(1000)
    ),
    multiplier: Config.number("RABBITMQ_RETRY_MULTIPLIER").pipe(
      Config.withDefault(5)
    ),
  }),
})

export const RabbitMQConfigLive = Layer.effect(RabbitMQConfig, rabbitmqConfigFromEnv)
