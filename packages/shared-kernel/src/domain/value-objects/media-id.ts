// packages/shared-kernel/src/domain/value-objects/media-id.ts

import * as S from 'effect/Schema'

export const MediaIdSchema = S.String
  .pipe(S.brand('MediaId'))
export type MediaId = typeof MediaIdSchema.Type
export const makeMediaId = S.decodeUnknownSync(MediaIdSchema)
