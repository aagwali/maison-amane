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

// ============================================
// PILOT EVENTS
// ============================================

export {
  MakePilotProductPublished,
  MakePilotProductSynced,
  PilotProductPublishedSchema,
  PilotProductSyncedSchema,
  type PilotProductPublished,
  type PilotProductSynced,
  type PilotDomainEvent,
} from './pilot-events'

// ============================================
// CATALOG EVENTS
// ============================================

export {
  MakeCatalogProductProjected,
  CatalogProductProjectedSchema,
  type CatalogProductProjected,
  type CatalogDomainEvent,
} from './catalog-events'
