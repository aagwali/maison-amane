// src/domain/shared/value-objects/correlation-id.ts

import * as S from 'effect/Schema'

export const CorrelationIdSchema = S.String.pipe(S.brand("CorrelationId"))
export type CorrelationId = typeof CorrelationIdSchema.Type
export const MakeCorrelationId = S.decodeUnknownSync(CorrelationIdSchema)
