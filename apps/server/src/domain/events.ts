// src/domain/events.ts
//
// Union type for all domain events across bounded contexts

import type { CatalogDomainEvent } from "./catalog"
import type { PilotDomainEvent } from "./pilot"

// ============================================
// DOMAIN EVENT (union of all bounded contexts)
// ============================================

export type DomainEvent = PilotDomainEvent | CatalogDomainEvent
