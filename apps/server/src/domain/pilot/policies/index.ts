// src/domain/pilot/policies/index.ts
//
// ============================================
// DDD: DOMAIN POLICIES
// ============================================
//
// Policies encode BUSINESS RULES that govern what operations are allowed.
// Unlike invariants (which are always true), policies are CONTEXTUAL rules:
//
//   - Authorization: "Can this user perform this action?"
//   - Business constraints: "Is this operation allowed in this state?"
//   - Rate limiting / throttling: "Can we sync again so soon?"
//
// Policies return Effect to allow for async checks or failures.
//
// ============================================
// EXAMPLE: Sync Policy
// ============================================
//
// import { Effect } from "effect"
// import type { PilotProduct } from "../aggregate"
// import type { SyncStatus } from "../value-objects"
//
// // Domain error for policy violations
// export class SyncNotAllowed extends Data.TaggedError("SyncNotAllowed")<{
//   readonly reason: string
// }> {}
//
// // Policy: Check if product can be synced
// export const canSyncProduct = (
//   product: PilotProduct,
//   now: Date
// ): Effect.Effect<void, SyncNotAllowed> => {
//   // Rule 1: Must be published
//   if (product.status !== ProductStatus.PUBLISHED) {
//     return Effect.fail(new SyncNotAllowed({
//       reason: "Only published products can be synced"
//     }))
//   }
//
//   // Rule 2: Respect cooldown after failure
//   if (product.syncStatus._tag === "SyncFailed") {
//     const cooldownMs = product.syncStatus.attempts * 60_000 // 1min per attempt
//     const elapsed = now.getTime() - product.syncStatus.failedAt.getTime()
//     if (elapsed < cooldownMs) {
//       return Effect.fail(new SyncNotAllowed({
//         reason: `Cooldown active, retry in ${Math.ceil((cooldownMs - elapsed) / 1000)}s`
//       }))
//     }
//   }
//
//   return Effect.void
// }
//
// ============================================
// EXAMPLE: Publication Policy
// ============================================
//
// export class PublicationNotAllowed extends Data.TaggedError("PublicationNotAllowed")<{
//   readonly reason: string
// }> {}
//
// export const canPublish = (
//   product: PilotProduct
// ): Effect.Effect<void, PublicationNotAllowed> => {
//   // Rule: Need at least 4 views including FRONT and DETAIL
//   const viewCount = 1 + 1 + product.views.additional.length
//   if (viewCount < 4) {
//     return Effect.fail(new PublicationNotAllowed({
//       reason: `Need at least 4 views, got ${viewCount}`
//     }))
//   }
//
//   return Effect.void
// }
//
// ============================================

// Export policies here when implemented
// export { canSyncProduct, SyncNotAllowed } from "./sync.policy"
export { canPublish, PublicationNotAllowed } from './publication.policy'
