// src/domain/media/enums.ts

import * as S from 'effect/Schema'

export const MediaStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
} as const

export type MediaStatus = (typeof MediaStatus)[keyof typeof MediaStatus]
export const MediaStatusSchema = S.Literal('PENDING', 'CONFIRMED')
