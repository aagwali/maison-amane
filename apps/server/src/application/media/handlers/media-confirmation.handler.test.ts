// src/application/media/handlers/media-confirmation.handler.test.ts
//
// INTEGRATION TESTS: Tests the media confirmation handler with TestLayer.
// Uses real in-memory media repository and spy publisher.

import { runPromise, provide, gen } from 'effect/Effect'
import { beforeEach, describe, expect, it } from 'vitest'

import { makeMedia, MediaStatus } from '../../../domain/media'
import { makeMediaId, makeMediaUrl, makeMimeType, makeFileSize } from '../../../domain/media'
import {
  makePilotProduct,
  makeProductId,
  makeProductLabel,
  makeProductDescription,
  makeNotSynced,
  makeImageUrl,
  ProductType,
  ProductCategory,
  PriceRange,
  ProductStatus,
  Size,
  ViewType,
} from '../../../domain/pilot'
import { makeCorrelationId, makeUserId } from '../../../domain/shared'
import { makePilotProductCreated, makePilotProductUpdated } from '../../../domain/pilot/events'
import { provideTestLayer, TEST_DATE } from '../../../test-utils'
import { MediaRepository } from '../../../ports/driven'

import { mediaConfirmationHandler } from './media-confirmation.handler'

// ============================================
// TEST FIXTURES
// ============================================

const FRONT_URL = 'http://test-media-server/front.jpg'
const DETAIL_URL = 'http://test-media-server/detail.jpg'
const ADDITIONAL_URL = 'http://test-media-server/additional.jpg'
const UNRELATED_URL = 'http://test-media-server/unrelated.jpg'

const buildMedia = (mediaId: string, externalUrl: string, status: MediaStatus) =>
  makeMedia({
    mediaId: makeMediaId(mediaId),
    externalUrl: makeMediaUrl(externalUrl),
    mimeType: makeMimeType('image/jpeg'),
    fileSize: makeFileSize(1024),
    status,
    uploadedAt: TEST_DATE,
    tags: [],
  })

const buildPilotProduct = () =>
  makePilotProduct({
    id: makeProductId('test-product-1'),
    label: makeProductLabel('Test Product'),
    type: ProductType.TAPIS,
    category: ProductCategory.RUNNER,
    description: makeProductDescription('Test description'),
    priceRange: PriceRange.STANDARD,
    variants: [{ _tag: 'StandardVariant', size: Size.REGULAR }],
    views: {
      front: { viewType: ViewType.FRONT, imageUrl: makeImageUrl(FRONT_URL) },
      detail: { viewType: ViewType.DETAIL, imageUrl: makeImageUrl(DETAIL_URL) },
      additional: [{ viewType: ViewType.AMBIANCE, imageUrl: makeImageUrl(ADDITIONAL_URL) }],
    },
    status: ProductStatus.DRAFT,
    syncStatus: makeNotSynced(),
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
  })

const buildPilotProductCreatedEvent = (product = buildPilotProduct()) =>
  makePilotProductCreated({
    productId: product.id,
    product,
    correlationId: makeCorrelationId('test-correlation-id'),
    userId: makeUserId('test-user'),
    timestamp: TEST_DATE,
  })

const buildPilotProductUpdatedEvent = (product = buildPilotProduct()) =>
  makePilotProductUpdated({
    productId: product.id,
    product,
    correlationId: makeCorrelationId('test-correlation-id'),
    userId: makeUserId('test-user'),
    timestamp: TEST_DATE,
  })

// ============================================
// TESTS
// ============================================

describe('mediaConfirmationHandler', () => {
  let testCtx: ReturnType<typeof provideTestLayer>

  beforeEach(() => {
    testCtx = provideTestLayer()
  })

  describe('success cases', () => {
    it('confirms pending media matching product view URLs', async () => {
      // Setup: Create pending media in repository
      await runPromise(
        gen(function* () {
          const repo = yield* MediaRepository
          yield* repo.save(buildMedia('media-1', FRONT_URL, MediaStatus.PENDING))
          yield* repo.save(buildMedia('media-2', DETAIL_URL, MediaStatus.PENDING))
        })
          .pipe(provide(testCtx.layer))
      )

      // Execute: Process PilotProductCreated event
      const event = buildPilotProductCreatedEvent()
      await runPromise(mediaConfirmationHandler(event)
        .pipe(provide(testCtx.layer)))

      // Verify: Media should be confirmed
      const frontMedia = await runPromise(
        gen(function* () {
          const repo = yield* MediaRepository
          return yield* repo.getById(makeMediaId('media-1'))
        })
          .pipe(provide(testCtx.layer))
      )

      const detailMedia = await runPromise(
        gen(function* () {
          const repo = yield* MediaRepository
          return yield* repo.getById(makeMediaId('media-2'))
        })
          .pipe(provide(testCtx.layer))
      )

      expect(frontMedia.status).toBe(MediaStatus.CONFIRMED)
      expect(detailMedia.status).toBe(MediaStatus.CONFIRMED)
    })

    it('is idempotent for already confirmed media', async () => {
      // Setup: Create already confirmed media
      await runPromise(
        gen(function* () {
          const repo = yield* MediaRepository
          yield* repo.save(buildMedia('media-1', FRONT_URL, MediaStatus.CONFIRMED))
        })
          .pipe(provide(testCtx.layer))
      )

      // Execute: Process event
      const event = buildPilotProductCreatedEvent()
      await runPromise(mediaConfirmationHandler(event)
        .pipe(provide(testCtx.layer)))

      // Verify: Media should still be confirmed (no error thrown)
      const media = await runPromise(
        gen(function* () {
          const repo = yield* MediaRepository
          return yield* repo.getById(makeMediaId('media-1'))
        })
          .pipe(provide(testCtx.layer))
      )

      expect(media.status).toBe(MediaStatus.CONFIRMED)
    })

    it('handles events with no matching media gracefully', async () => {
      // Setup: Create media with unrelated URL
      await runPromise(
        gen(function* () {
          const repo = yield* MediaRepository
          yield* repo.save(buildMedia('media-1', UNRELATED_URL, MediaStatus.PENDING))
        })
          .pipe(provide(testCtx.layer))
      )

      // Execute: Process event (should not throw)
      const event = buildPilotProductCreatedEvent()
      await runPromise(mediaConfirmationHandler(event)
        .pipe(provide(testCtx.layer)))

      // Verify: Unrelated media should still be pending
      const media = await runPromise(
        gen(function* () {
          const repo = yield* MediaRepository
          return yield* repo.getById(makeMediaId('media-1'))
        })
          .pipe(provide(testCtx.layer))
      )

      expect(media.status).toBe(MediaStatus.PENDING)
    })

    it('extracts URLs from front, detail and additional views', async () => {
      // Setup: Create pending media for all three types of views
      await runPromise(
        gen(function* () {
          const repo = yield* MediaRepository
          yield* repo.save(buildMedia('media-1', FRONT_URL, MediaStatus.PENDING))
          yield* repo.save(buildMedia('media-2', DETAIL_URL, MediaStatus.PENDING))
          yield* repo.save(buildMedia('media-3', ADDITIONAL_URL, MediaStatus.PENDING))
        })
          .pipe(provide(testCtx.layer))
      )

      // Execute: Process event
      const event = buildPilotProductCreatedEvent()
      await runPromise(mediaConfirmationHandler(event)
        .pipe(provide(testCtx.layer)))

      // Verify: All three media should be confirmed
      const frontMedia = await runPromise(
        gen(function* () {
          const repo = yield* MediaRepository
          return yield* repo.getById(makeMediaId('media-1'))
        })
          .pipe(provide(testCtx.layer))
      )

      const detailMedia = await runPromise(
        gen(function* () {
          const repo = yield* MediaRepository
          return yield* repo.getById(makeMediaId('media-2'))
        })
          .pipe(provide(testCtx.layer))
      )

      const additionalMedia = await runPromise(
        gen(function* () {
          const repo = yield* MediaRepository
          return yield* repo.getById(makeMediaId('media-3'))
        })
          .pipe(provide(testCtx.layer))
      )

      expect(frontMedia.status).toBe(MediaStatus.CONFIRMED)
      expect(detailMedia.status).toBe(MediaStatus.CONFIRMED)
      expect(additionalMedia.status).toBe(MediaStatus.CONFIRMED)
    })
  })

  describe('event types', () => {
    it('processes PilotProductCreated events', async () => {
      // Setup
      await runPromise(
        gen(function* () {
          const repo = yield* MediaRepository
          yield* repo.save(buildMedia('media-1', FRONT_URL, MediaStatus.PENDING))
        })
          .pipe(provide(testCtx.layer))
      )

      // Execute: Process PilotProductCreated
      const event = buildPilotProductCreatedEvent()
      await runPromise(mediaConfirmationHandler(event)
        .pipe(provide(testCtx.layer)))

      // Verify
      const media = await runPromise(
        gen(function* () {
          const repo = yield* MediaRepository
          return yield* repo.getById(makeMediaId('media-1'))
        })
          .pipe(provide(testCtx.layer))
      )

      expect(media.status).toBe(MediaStatus.CONFIRMED)
    })

    it('processes PilotProductUpdated events', async () => {
      // Setup
      await runPromise(
        gen(function* () {
          const repo = yield* MediaRepository
          yield* repo.save(buildMedia('media-1', FRONT_URL, MediaStatus.PENDING))
        })
          .pipe(provide(testCtx.layer))
      )

      // Execute: Process PilotProductUpdated
      const event = buildPilotProductUpdatedEvent()
      await runPromise(mediaConfirmationHandler(event)
        .pipe(provide(testCtx.layer)))

      // Verify
      const media = await runPromise(
        gen(function* () {
          const repo = yield* MediaRepository
          return yield* repo.getById(makeMediaId('media-1'))
        })
          .pipe(provide(testCtx.layer))
      )

      expect(media.status).toBe(MediaStatus.CONFIRMED)
    })
  })
})
