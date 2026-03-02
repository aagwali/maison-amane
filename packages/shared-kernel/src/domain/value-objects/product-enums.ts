// packages/shared-kernel/src/domain/value-objects/product-enums.ts
//
// Shared enums: valeurs métier utilisées par plusieurs bounded contexts.
// Ne pas dupliquer — si un context ajoute une valeur, elle est visible partout.

import * as S from 'effect/Schema'

// ============================================
// PRODUCT SHAPE
// ============================================

export const ProductShape = {
  RUNNER: 'RUNNER',
  STANDARD: 'STANDARD',
} as const

export type ProductShape = (typeof ProductShape)[keyof typeof ProductShape]

export const ProductShapeSchema = S.Literal('RUNNER', 'STANDARD')
export const makeProductShape = S.decodeUnknownSync(ProductShapeSchema)

// ============================================
// MATERIAL
// ============================================

export const Material = {
  MTIRT: 'MTIRT',
  BENI_OUARAIN: 'BENI_OUARAIN',
  AZILAL: 'AZILAL',
} as const

export type Material = (typeof Material)[keyof typeof Material]

export const MaterialSchema = S.Literal('MTIRT', 'BENI_OUARAIN', 'AZILAL')
export const makeMaterial = S.decodeUnknownSync(MaterialSchema)

// ============================================
// SIZE
// ============================================

export const Size = {
  EXTRA_SMALL: 'EXTRA_SMALL',
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',
  EXTRA_LARGE: 'EXTRA_LARGE',
  CUSTOM: 'CUSTOM',
} as const

export type Size = (typeof Size)[keyof typeof Size]

export const SizeSchema = S.Literal(
  'EXTRA_SMALL',
  'SMALL',
  'MEDIUM',
  'LARGE',
  'EXTRA_LARGE',
  'CUSTOM'
)
export const makeSize = S.decodeUnknownSync(SizeSchema)
