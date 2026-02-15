// src/domain/media/errors.ts

import { Data } from 'effect'

export class MediaNotFoundError extends Data.TaggedError('MediaNotFoundError')<{
  readonly mediaId: string
}> {}

export class MediaAlreadyConfirmedError extends Data.TaggedError('MediaAlreadyConfirmedError')<{
  readonly mediaId: string
}> {}
