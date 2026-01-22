// src/main.ts

import { Effect, pipe } from "effect"
import { MakeCorrelationId, MakeUserId } from "./domain/shared"
import { handlePilotProductCreation, MakePilotProductCreationCommand, UnvalidatedProductData } from "./application/pilot"
import { DevelopmentLayer } from "./composition"

// ============================================
// TEST DATA
// ============================================

const input: UnvalidatedProductData = {
  label: "Tapis Berbere Atlas",
  type: "TAPIS",
  category: "STANDARD",
  description: "Un beau tapis fait main",
  priceRange: "PREMIUM",
  variants: [
    { size: "REGULAR" },
    { size: "LARGE" },
  ],
  views: [
    { viewType: "FRONT", imageUrl: "https://cdn.example.com/front.jpg" },
    { viewType: "DETAIL", imageUrl: "https://cdn.example.com/detail.jpg" },
    { viewType: "BACK", imageUrl: "https://cdn.example.com/back.jpg" },
    { viewType: "AMBIANCE", imageUrl: "https://cdn.example.com/ambiance.jpg" },
  ],
  status: "DRAFT",
}

const makePilotProductCreationCommand = (unvalidatedProductData: UnvalidatedProductData) => MakePilotProductCreationCommand({
  _tag: "CreatePilotProductCommand",
  userId: MakeUserId("user-456"),
  correlationId: MakeCorrelationId("corr-123"),
  timestamp: new Date(),
  data: unvalidatedProductData,
})

// ============================================
// PROGRAM
// ============================================

const program = pipe(
  makePilotProductCreationCommand(input),
  handlePilotProductCreation,
  Effect.tap((product) =>
    Effect.sync(() => {
      console.log("Created product:")
      console.log("  id:", product.id)
      console.log("  label:", product.label)
      console.log("  status:", product.status)
      console.log("  variants:", product.variants)
    }),
  ))

// ============================================
// RUN
// ============================================

program.pipe(Effect.provide(DevelopmentLayer)).pipe(Effect.runPromise)
