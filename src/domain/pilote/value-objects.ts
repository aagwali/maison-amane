// src/domain/pilote/value-objects.ts

import * as S from "effect/Schema"
import { ViewTypeSchema, Size } from "./enums"

// ============================================
// NOMINAL TYPES (pas de validation runtime)
// ============================================

export const ProductIdSchema = S.String.pipe(S.brand("ProductId"))
export type ProductId = typeof ProductIdSchema.Type
export const MakeProductId = S.decodeUnknownSync(ProductIdSchema)

export const VariantIdSchema = S.String.pipe(S.brand("VariantId"))
export type VariantId = typeof VariantIdSchema.Type
export const MakeVariantId = S.decodeUnknownSync(VariantIdSchema)

export const ShopifyProductIdSchema = S.String.pipe(S.brand("ShopifyProductId"))
export type ShopifyProductId = typeof ShopifyProductIdSchema.Type
export const MakeShopifyProductId = S.decodeUnknownSync(ShopifyProductIdSchema)

export const CorrelationIdSchema = S.String.pipe(S.brand("CorrelationId"))
export type CorrelationId = typeof CorrelationIdSchema.Type
export const MakeCorrelationId = S.decodeUnknownSync(CorrelationIdSchema)

export const UserIdSchema = S.String.pipe(S.brand("UserId"))
export type UserId = typeof UserIdSchema.Type
export const MakeUserId = S.decodeUnknownSync(UserIdSchema)

// ============================================
// REFINED TYPES (avec validation runtime)
// ============================================

export const ProductLabelSchema = S.Trim.pipe(
  S.minLength(1),
  S.maxLength(255),
  S.brand("ProductLabel")
)
export type ProductLabel = typeof ProductLabelSchema.Type
export const MakeProductLabel = S.decodeUnknownSync(ProductLabelSchema)

export const ProductDescriptionSchema = S.String.pipe(
  S.maxLength(5000),
  S.brand("ProductDescription")
)
export type ProductDescription = typeof ProductDescriptionSchema.Type
export const MakeProductDescription = S.decodeUnknownSync(ProductDescriptionSchema)

export const PriceSchema = S.Number.pipe(
  S.int(),
  S.positive(),
  S.brand("Price")
)
export type Price = typeof PriceSchema.Type
export const MakePrice = S.decodeUnknownSync(PriceSchema)

export const PositiveCmSchema = S.Number.pipe(
  S.int(),
  S.positive(),
  S.brand("PositiveCm")
)
export type PositiveCm = typeof PositiveCmSchema.Type
export const MakePositiveCm = S.decodeUnknownSync(PositiveCmSchema)

export const ImageUrlSchema = S.String.pipe(
  S.pattern(/^https:\/\/.+/),
  S.brand("ImageUrl")
)
export type ImageUrl = typeof ImageUrlSchema.Type
export const MakeImageUrl = S.decodeUnknownSync(ImageUrlSchema)

// ============================================
// COMPOSITE VALUE OBJECTS
// ============================================

export const CustomDimensionSchema = S.Struct({
  width: PositiveCmSchema,
  length: PositiveCmSchema
})
export type CustomDimension = typeof CustomDimensionSchema.Type

export const ProductViewSchema = S.Struct({
  viewType: ViewTypeSchema,
  imageUrl: ImageUrlSchema,
})
export type ProductView = typeof ProductViewSchema.Type

export interface ProductViews {
  readonly front: ProductView
  readonly detail: ProductView
  readonly additional: readonly ProductView[]
}

// ============================================
// VALIDATED VARIANTS (input validation, sans id)
// ============================================

const ValidatedStandardVariantSchema = S.Struct({
  size: S.Literal(Size.STANDARD, Size.LARGE),
}).pipe(S.attachPropertySignature("_tag", "StandardVariant"))

const ValidatedCustomVariantSchema = S.Struct({
  size: S.Literal(Size.CUSTOM),
  customDimensions: CustomDimensionSchema,
  price: PriceSchema,
}).pipe(S.attachPropertySignature("_tag", "CustomVariant"))

export const ValidatedVariantSchema = S.Union(ValidatedStandardVariantSchema, ValidatedCustomVariantSchema)
export type ValidatedVariant = typeof ValidatedVariantSchema.Type
export type ValidatedStandardVariant = typeof ValidatedStandardVariantSchema.Type
export type ValidatedCustomVariant = typeof ValidatedCustomVariantSchema.Type

// ============================================
// PRODUCT VARIANTS (entities avec id)
// ============================================

export const StandardVariantSchema = S.Struct({
  _tag: S.Literal("StandardVariant"),
  id: VariantIdSchema,
  size: S.Literal(Size.STANDARD, Size.LARGE),
})
export type StandardVariant = typeof StandardVariantSchema.Type

export const CustomVariantSchema = S.Struct({
  _tag: S.Literal("CustomVariant"),
  id: VariantIdSchema,
  size: S.Literal(Size.CUSTOM),
  customDimensions: CustomDimensionSchema,
  price: PriceSchema,
})
export type CustomVariant = typeof CustomVariantSchema.Type

export const ProductVariantSchema = S.Union(CustomVariantSchema, StandardVariantSchema)
export type ProductVariant = typeof ProductVariantSchema.Type

export interface SyncError {
  readonly code: string
  readonly message: string
  readonly details: unknown
}

// ============================================
// SYNC STATUS (Tagged Union)
// ============================================

export type SyncStatus = NotSynced | Synced | SyncFailed

export interface NotSynced {
  readonly _tag: "NotSynced"
}

export interface Synced {
  readonly _tag: "Synced"
  readonly shopifyProductId: ShopifyProductId
  readonly syncedAt: Date
}

export interface SyncFailed {
  readonly _tag: "SyncFailed"
  readonly error: SyncError
  readonly failedAt: Date
  readonly attempts: number
}

export const SyncStatus = {
  notSynced: (): SyncStatus => ({ _tag: "NotSynced" }),
  
  synced: (shopifyProductId: ShopifyProductId, syncedAt: Date): SyncStatus => ({
    _tag: "Synced",
    shopifyProductId,
    syncedAt
  }),
  
  failed: (error: SyncError, failedAt: Date, attempts: number): SyncStatus => ({
    _tag: "SyncFailed",
    error,
    failedAt,
    attempts
  })
} as const


