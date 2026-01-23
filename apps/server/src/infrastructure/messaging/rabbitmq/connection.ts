// src/infrastructure/messaging/rabbitmq/connection.ts

import amqp from 'amqplib'
import { Context, Effect, Layer, Redacted } from 'effect'

import { RabbitMQConfig } from '../../../composition/config'

// ============================================
// RABBITMQ CONNECTION ERROR
// ============================================

export class RabbitMQConnectionError {
  readonly _tag = "RabbitMQConnectionError"
  constructor(readonly cause: unknown) {}
}

// ============================================
// RABBITMQ CONNECTION SERVICE
// ============================================

export interface RabbitMQConnectionValue {
  readonly connection: amqp.ChannelModel
  readonly channel: amqp.Channel
}

export class RabbitMQConnection extends Context.Tag("RabbitMQConnection")<
  RabbitMQConnection,
  RabbitMQConnectionValue
>() {}

// ============================================
// RABBITMQ CONNECTION LAYER (scoped)
// Requires RabbitMQConfig
// ============================================

export const RabbitMQConnectionLayer = Layer.scoped(
  RabbitMQConnection,
  Effect.gen(function* () {
    const config = yield* RabbitMQConfig
    const url = Redacted.value(config.url)

    const { connection, channel } = yield* Effect.acquireRelease(
      Effect.tryPromise({
        try: async () => {
          const conn = await amqp.connect(url)
          const ch = await conn.createChannel()
          return { connection: conn, channel: ch }
        },
        catch: (error) => new RabbitMQConnectionError(error),
      }),
      ({ connection: conn, channel: ch }) =>
        Effect.promise(async () => {
          await ch.close()
          await conn.close()
        }).pipe(Effect.tap(() => Effect.logInfo("RabbitMQ connection closed")))
    )

    yield* Effect.logInfo("RabbitMQ connected")
    return { connection, channel }
  })
)
