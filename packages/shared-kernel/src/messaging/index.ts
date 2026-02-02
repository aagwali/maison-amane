// packages/shared-kernel/src/messaging/index.ts

// ============================================
// TOPOLOGY
// ============================================

export {
  RabbitMQConnection,
  RabbitMQError,
  EXCHANGES,
  ROUTING_KEYS,
  QUEUES,
  declareExchanges,
  declareCatalogProjectionInfra,
  declareShopifySyncInfra,
  declareAllTopology,
  type RabbitMQConnectionValue,
} from './topology'
