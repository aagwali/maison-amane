// src/domain/media/aggregate.test.ts

import { describe, it, expect } from 'vitest'
import { pipe, Either } from 'effect'
import { runPromise, either } from 'effect/Effect'

import { makeMedia, confirmMedia } from './aggregate'
import { MediaStatus } from './enums'
import { makeMediaId, makeMediaUrl, makeMimeType, makeFileSize } from './value-objects'

describe('Media aggregate', () => {
  describe('confirmMedia', () => {
    it('transitions PENDING → CONFIRMED', async () => {
      const media = makeMedia({
        mediaId: makeMediaId('test-media-1'),
        externalUrl: makeMediaUrl('http://localhost:3001/uploads/test.jpg'),
        mimeType: makeMimeType('image/jpeg'),
        fileSize: makeFileSize(1024),
        status: MediaStatus.PENDING,
        uploadedAt: new Date(),
        tags: [],
      })

      const result = await runPromise(confirmMedia(media))
      expect(result.status).toBe(MediaStatus.CONFIRMED)
    })

    it('fails with MediaAlreadyConfirmedError when already confirmed', async () => {
      const media = makeMedia({
        mediaId: makeMediaId('test-media-2'),
        externalUrl: makeMediaUrl('http://localhost:3001/uploads/test2.jpg'),
        mimeType: makeMimeType('image/png'),
        fileSize: makeFileSize(2048),
        status: MediaStatus.CONFIRMED,
        uploadedAt: new Date(),
        tags: [],
      })

      const result = await pipe(confirmMedia(media), either, runPromise)
      expect(Either.isLeft(result)).toBe(true)
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe('MediaAlreadyConfirmedError')
      }
    })
  })
})
