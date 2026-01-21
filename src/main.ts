// src/main.ts

import { Effect } from "effect"
import { MakeCorrelationId, MakeUserId } from "./domain/shared"
import { createPilotProduct, CreatePilotProductCommand } from "./application/pilot"
import { DevelopmentLayer } from "./composition"

// ============================================
// TEST DATA
// ============================================

const testCommand = CreatePilotProductCommand.create(
  {
    label: "Tapis Berbere Atlas",
    type: "TAPIS",
    category: "STANDARD",
    description: "Un beau tapis fait main",
    priceRange: "PREMIUM",
    variants: [
      { size: "STANDARD" },
      { size: "LARGE" }
    ],
    views: [
      { viewType: "FRONT", imageUrl: "https://cdn.example.com/front.jpg" },
      { viewType: "DETAIL", imageUrl: "https://cdn.example.com/detail.jpg" },
      { viewType: "BACK", imageUrl: "https://cdn.example.com/back.jpg" },
      { viewType: "AMBIANCE", imageUrl: "https://cdn.example.com/ambiance.jpg" }
    ],
    status: "DRAFT"
  },
  MakeCorrelationId("corr-123"),
  MakeUserId("user-456")
)

// ============================================
// PROGRAM
// ============================================

const program = createPilotProduct(testCommand)
  .pipe(
    Effect.tap((product) =>
      Effect.sync(() => {
        console.log("Created product:")
        console.log("  id:", product.id)
        console.log("  label:", product.label)
        console.log("  status:", product.status)
        console.log("  variants:", product.variants)
      })
    )
  )
  .pipe(Effect.provide(DevelopmentLayer))

// ============================================
// RUN
// ============================================

Effect.runPromise(program)
