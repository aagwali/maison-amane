// packages/api/src/dtos/media.request.ts

import { Schema as S } from 'effect'

// ============================================
// MEDIA REGISTRATION REQUEST
// ============================================

export const RegisterMediaRequest = S.Struct({
  externalUrl: S.String,
  filename: S.String,
  mimeType: S.String,
  fileSize: S.Number,
  tags: S.optional(S.Array(S.String)),
})

export type RegisterMediaRequest = S.Schema.Type<typeof RegisterMediaRequest>
