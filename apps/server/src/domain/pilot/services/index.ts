// src/domain/pilot/services/index.ts
//
// ============================================
// DDD: DOMAIN SERVICES
// ============================================
//
// Domain services contain BUSINESS LOGIC that:
//
//   1. Doesn't naturally fit within a single entity/aggregate
//   2. Involves calculations or algorithms specific to the domain
//   3. May coordinate between multiple aggregates (stateless)
//
// Current services:
//   - SyncStatusMachine: State transitions for sync workflow (internal to aggregate)
//   - ViewsService: Structuring/flattening product views
//
// Examples of services you might add:
//
//   - PricingService: Calculate custom variant price based on dimensions
//
//       export const calculatePrice = (
//         dimensions: CustomDimension,
//         category: ProductCategory,
//         priceRange: PriceRange
//       ): Price => {
//         const surface = dimensions.width * dimensions.length
//         const coefficient = CATEGORY_COEFFICIENTS[category][priceRange]
//         return makePrice(Math.round(surface * coefficient))
//       }
//
//   - DimensionService: Validate custom dimensions against category rules
//
// Domain services are PURE - they don't depend on infrastructure.
// If a service needs I/O, it belongs in the application layer.
//
// ============================================

export { structureViews, flattenViews, MIN_VIEWS } from './views.service'
