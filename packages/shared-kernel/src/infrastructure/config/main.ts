// packages/shared-kernel/src/infrastructure/config/main.ts

export {
  MongoConfig,
  MongoConfigLive,
  mongoConfigFromEnv,
  type MongoConfigValue,
} from './mongo.config'

export {
  RabbitMQConfig,
  RabbitMQConfigLive,
  rabbitmqConfigFromEnv,
  type RabbitMQConfigValue,
} from './rabbitmq.config'
