// src/application/pilot/commands/create-pilot-product.command.ts

import type { CorrelationId, UserId } from "../../../domain/shared"

// ============================================
// UNVALIDATED DATA (from UI)
// ============================================

export interface UnvalidatedVariant {
  readonly size: string
  readonly customDimensions?: {
    readonly width: number
    readonly length: number
  }
  readonly price?: number
}

export interface UnvalidatedView {
  readonly viewType: string
  readonly imageUrl: string
}

export interface UnvalidatedProductData {
  readonly label: string
  readonly type: string
  readonly category: string
  readonly description: string
  readonly priceRange: string
  readonly variants: readonly UnvalidatedVariant[]
  readonly views: readonly UnvalidatedView[]
  readonly status: string
}

// ============================================
// CREATE PILOT PRODUCT COMMAND
// ============================================

// todo : remplacer par schema + technique de validation fp-demo like ?

export interface CreatePilotProductCommand {
  readonly _tag: "CreatePilotProductCommand"
  readonly data: UnvalidatedProductData
  readonly correlationId: CorrelationId
  readonly userId: UserId
  readonly timestamp: Date
}

export const CreatePilotProductCommand = {
  create: (
    data: UnvalidatedProductData,
    correlationId: CorrelationId,
    userId: UserId
  ): CreatePilotProductCommand => ({
    _tag: "CreatePilotProductCommand",
    data,
    correlationId,
    userId,
    timestamp: new Date()
  })
}
