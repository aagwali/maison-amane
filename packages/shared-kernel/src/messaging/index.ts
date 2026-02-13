// packages/shared-kernel/src/messaging/index.ts

// ============================================
// TOPOLOGY
// ============================================

export {
  RabbitMQConnection,
  RabbitMQError,
  EXCHANGES,
  ROUTING_KEYS,
  declareExchange,
  declareConsumerInfrastructure,
  bootstrapConsumer,
  toDlxExchange,
  type RabbitMQConnectionValue,
  type ConsumerInfraConfig,
  type ConsumerBootstrapConfig,
} from './topology'
