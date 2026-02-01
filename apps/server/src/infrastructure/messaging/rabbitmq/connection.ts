// src/infrastructure/messaging/rabbitmq/connection.ts

import amqp from 'amqplib'
import { Data, Effect, Layer, Redacted } from 'effect'
import { RabbitMQConnection } from '@maison-amane/shared-kernel'

import { RabbitMQConfig } from '../../../composition/config'

// ============================================
// RABBITMQ CONNECTION ERROR
// ============================================

export class RabbitMQConnectionError extends Data.TaggedError('RabbitMQConnectionError')<{
  readonly cause: unknown
}> {}

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
        catch: (error) => new RabbitMQConnectionError({ cause: error }),
      }),
      ({ connection: conn, channel: ch }) =>
        Effect.promise(async () => {
          await ch.close()
          await conn.close()
        }).pipe(Effect.tap(() => Effect.logInfo('RabbitMQ connection closed')))
    )

    yield* Effect.logInfo('RabbitMQ connected')
    return { connection, channel }
  })
)
