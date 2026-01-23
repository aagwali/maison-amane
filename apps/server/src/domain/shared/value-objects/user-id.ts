// src/domain/shared/value-objects/user-id.ts

import * as S from 'effect/Schema'

export const UserIdSchema = S.String.pipe(S.brand("UserId"))
export type UserId = typeof UserIdSchema.Type
export const MakeUserId = S.decodeUnknownSync(UserIdSchema)
