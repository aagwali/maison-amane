// packages/api/src/dtos/media.response.ts

import { Schema as S } from 'effect'

// ============================================
// MEDIA REGISTRATION RESPONSE
// ============================================

export const MediaRegistrationResponse = S.Struct({
  mediaId: S.String,
  imageUrl: S.String,
})

export type MediaRegistrationResponse = S.Schema.Type<typeof MediaRegistrationResponse>
