// src/infrastructure/messaging/rabbitmq/connection.ts

import amqp from 'amqplib'
import { Data, Layer, Redacted } from 'effect'
import { gen, acquireRelease, tryPromise, promise, tap, logInfo } from 'effect/Effect'
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
  gen(function* () {
    const config = yield* RabbitMQConfig
    const url = Redacted.value(config.url)

    const { connection, channel } = yield* acquireRelease(
      tryPromise({
        try: async () => {
          const conn = await amqp.connect(url)
          const ch = await conn.createChannel()
          return { connection: conn, channel: ch }
        },
        catch: (error) => new RabbitMQConnectionError({ cause: error }),
      }),
      ({ connection: conn, channel: ch }) =>
        promise(async () => {
          await ch.close()
          await conn.close()
        })
          .pipe(tap(() => logInfo('RabbitMQ connection closed')))
    )

    yield* logInfo('RabbitMQ connected')
    return { connection, channel }
  })
)
