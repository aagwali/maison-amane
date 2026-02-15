// src/application/media/handlers/confirm-media.handler.test.ts

import { describe, it, expect } from 'vitest'
import { gen, provide, runPromise } from 'effect/Effect'

import {
  makeMedia,
  MediaStatus,
  makeMediaId,
  makeMediaUrl,
  makeMimeType,
  makeFileSize,
} from '../../../domain/media'
import { MediaRepository } from '../../../ports/driven'
import { provideTestLayer, TEST_DATE } from '../../../test-utils/test-layer'

import { confirmMediaByUrls } from './confirm-media.handler'

describe('confirmMediaByUrls', () => {
  it('confirms matching pending media', async () => {
    const { layer } = provideTestLayer()

    // Setup: create a pending media
    const pendingMedia = makeMedia({
      mediaId: makeMediaId('media-1'),
      externalUrl: makeMediaUrl('http://test-media-server/photo1.jpg'),
      mimeType: makeMimeType('image/jpeg'),
      fileSize: makeFileSize(1024),
      status: MediaStatus.PENDING,
      uploadedAt: TEST_DATE,
      tags: [],
    })

    await runPromise(
      gen(function* () {
        const repo = yield* MediaRepository
        yield* repo.save(pendingMedia)
      })
        .pipe(provide(layer))
    )

    // Act: confirm by URL
    await runPromise(
      confirmMediaByUrls(['http://test-media-server/photo1.jpg'])
        .pipe(provide(layer))
    )

    // Assert: media is now confirmed
    const updatedMedia = await runPromise(
      gen(function* () {
        const repo = yield* MediaRepository
        return yield* repo.getById(makeMediaId('media-1'))
      })
        .pipe(provide(layer))
    )

    expect(updatedMedia.status).toBe(MediaStatus.CONFIRMED)
  })

  it('is idempotent for already confirmed media', async () => {
    const { layer } = provideTestLayer()

    // Setup: create a confirmed media
    const confirmedMedia = makeMedia({
      mediaId: makeMediaId('media-2'),
      externalUrl: makeMediaUrl('http://test-media-server/photo2.jpg'),
      mimeType: makeMimeType('image/jpeg'),
      fileSize: makeFileSize(1024),
      status: MediaStatus.CONFIRMED,
      uploadedAt: TEST_DATE,
      tags: [],
    })

    await runPromise(
      gen(function* () {
        const repo = yield* MediaRepository
        yield* repo.save(confirmedMedia)
      })
        .pipe(provide(layer))
    )

    // Act: confirm again (should be no-op)
    await runPromise(
      confirmMediaByUrls(['http://test-media-server/photo2.jpg'])
        .pipe(provide(layer))
    )

    // Assert: media is still confirmed
    const media = await runPromise(
      gen(function* () {
        const repo = yield* MediaRepository
        return yield* repo.getById(makeMediaId('media-2'))
      })
        .pipe(provide(layer))
    )

    expect(media.status).toBe(MediaStatus.CONFIRMED)
  })

  it('ignores URLs with no matching media', async () => {
    const { layer } = provideTestLayer()

    // Act: confirm non-existent URLs (should not throw)
    await runPromise(
      confirmMediaByUrls(['http://test-media-server/non-existent.jpg'])
        .pipe(provide(layer))
    )

    // No assertion needed - test passes if no error thrown
  })

  it('does nothing for empty URL list', async () => {
    const { layer } = provideTestLayer()

    // Act: confirm empty list (should not throw)
    await runPromise(confirmMediaByUrls([])
      .pipe(provide(layer)))

    // No assertion needed - test passes if no error thrown
  })
})
