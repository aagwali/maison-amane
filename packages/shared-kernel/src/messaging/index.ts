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
  toDlxExchange,
  type RabbitMQConnectionValue,
  type ConsumerInfraConfig,
} from './topology'
