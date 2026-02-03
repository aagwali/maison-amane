// src/domain/pilot/policies/publication.policy.ts
//
// DDD: Publication Policy
// Encodes business rules for when a product can be published.

import { Data, Effect } from 'effect'

import { ProductStatus } from '../enums'
import type { PilotProduct } from '../aggregate'

// ============================================
// POLICY ERROR
// ============================================

export class PublicationNotAllowed extends Data.TaggedError('PublicationNotAllowed')<{
  readonly reason: string
}> {}

// ============================================
// PUBLICATION POLICY
// ============================================

/**
 * Checks if a product can transition to PUBLISHED status.
 *
 * Business rules:
 * - Product must be in DRAFT status (cannot re-publish ARCHIVED)
 * - Views validation is handled at application layer (MIN_VIEWS = 2)
 *
 * Add additional business rules here as needed:
 * - Minimum price threshold
 * - Required categories
 * - Mandatory fields completion
 */
export const canPublish = (product: PilotProduct): Effect.Effect<void, PublicationNotAllowed> => {
  // Rule: Cannot publish from ARCHIVED status
  if (product.status === ProductStatus.ARCHIVED) {
    return Effect.fail(
      new PublicationNotAllowed({
        reason: 'Cannot publish an archived product',
      })
    )
  }

  // Rule: Already published products don't need re-publication
  if (product.status === ProductStatus.PUBLISHED) {
    return Effect.fail(
      new PublicationNotAllowed({
        reason: 'Product is already published',
      })
    )
  }

  // All rules passed
  return Effect.void
}
