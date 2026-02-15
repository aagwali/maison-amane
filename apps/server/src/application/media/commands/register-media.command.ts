// src/application/media/commands/register-media.command.ts

import * as S from 'effect/Schema'
import { Data } from 'effect'

import { CorrelationIdSchema, UserIdSchema } from '../../../domain/shared'

// ============================================
// REGISTER MEDIA COMMAND
// ============================================
// Registers a media file already uploaded to CDN
// externalUrl is always required (CDN direct upload pattern)

const RegisterMediaCommandSchema = S.TaggedStruct('RegisterMediaCommand', {
  externalUrl: S.String,
  filename: S.String,
  mimeType: S.String,
  fileSize: S.Number,
  tags: S.Array(S.String),
  correlationId: CorrelationIdSchema,
  userId: UserIdSchema,
  timestamp: S.Date,
})

export type RegisterMediaCommand = typeof RegisterMediaCommandSchema.Type

export const makeRegisterMediaCommand = (
  params: Omit<RegisterMediaCommand, '_tag'>
): RegisterMediaCommand =>
  Data.case<RegisterMediaCommand>()({ _tag: 'RegisterMediaCommand', ...params })
