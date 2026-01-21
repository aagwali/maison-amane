// src/main.ts

import { Effect, pipe, Layer } from "effect"
import {
  createPilotProduct,
  PilotProductCommand,
  MakeCorrelationId,
  MakeUserId,
} from "./domain/pilote/index"
import {
  UuidIdGeneratorLive,
  SystemClockLive,
  ConsoleEventPublisherLive,
  InMemoryProductRepositoryLive
} from "./infrastructure/pilote/implementations"

// Compose all layers
const AppLayer = Layer.mergeAll(
  UuidIdGeneratorLive,
  SystemClockLive,
  ConsoleEventPublisherLive,
  InMemoryProductRepositoryLive
)

// Test data
const testCommand = PilotProductCommand.create(
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

// Run
const program = pipe(
  createPilotProduct(testCommand),
  Effect.tap((product) =>
    Effect.sync(() => {
      console.log("Created product:")
      console.log("  id:", product.id)
      console.log("  label:", product.label)
      console.log("  status:", product.status)
      console.log("  variants:", product.variants.length)
    })
  )
)

Effect.runPromise(
  pipe(program, Effect.provide(AppLayer))
).then(
  () => console.log("\nSuccess!"),
  (err) => console.error("\nError:", err)
)
