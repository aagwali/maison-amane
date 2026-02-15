// src/application/media/integration/media-flow.integration.test.ts
//
// INTEGRATION TEST: End-to-end flow for media upload and confirmation
//
// This test simulates the complete flow:
// 1. Upload a media file → creates Media with PENDING status
// 2. Create a PilotProduct referencing the uploaded media
// 3. PilotProductCreated event is emitted
// 4. Media confirmation handler processes the event
// 5. Media status transitions to CONFIRMED

import { beforeEach, describe, expect, it } from 'vitest'
import { gen, provide, runPromise } from 'effect/Effect'

import { MediaRepository } from '../../../ports/driven'
import { MediaStatus } from '../../../domain/media'
import { provideTestLayer, TEST_DATE } from '../../../test-utils'
import { makeCorrelationId, makeUserId } from '../../../domain/shared'
import {
  PriceRange,
  ProductCategory,
  ProductStatus,
  ProductType,
  Size,
  ViewType,
} from '../../../domain/pilot'
import { mediaRegistrationHandler } from '../handlers/register-media.handler'
import { mediaConfirmationHandler } from '../handlers/media-confirmation.handler'
import { pilotProductCreationHandler } from '../../pilot/handlers/create-pilot-product.handler'
import { makePilotProductCreationCommand } from '../../pilot/commands'
import { makeRegisterMediaCommand } from '../commands/register-media.command'

// ============================================
// INTEGRATION TEST: COMPLETE MEDIA FLOW
// ============================================

describe('Media Upload and Confirmation Flow (Integration)', () => {
  let testCtx: ReturnType<typeof provideTestLayer>

  beforeEach(() => {
    testCtx = provideTestLayer()
  })

  it('completes full flow: upload → product creation → confirmation', async () => {
    // ============================================
    // STEP 1: Upload media files (simulate 3 uploads)
    // ============================================

    const frontUploadCommand = makeRegisterMediaCommand({
      externalUrl: 'https://cdn.example.com/images/front.jpg',
      filename: 'front.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024,
      tags: [],
      correlationId: makeCorrelationId('upload-front'),
      userId: makeUserId('integration-test-user'),
      timestamp: TEST_DATE,
    })

    const detailUploadCommand = makeRegisterMediaCommand({
      externalUrl: 'https://cdn.example.com/images/detail.jpg',
      filename: 'detail.jpg',
      mimeType: 'image/jpeg',
      fileSize: 2048,
      tags: [],
      correlationId: makeCorrelationId('upload-detail'),
      userId: makeUserId('integration-test-user'),
      timestamp: TEST_DATE,
    })

    const ambianceUploadCommand = makeRegisterMediaCommand({
      externalUrl: 'https://cdn.example.com/images/ambiance.jpg',
      filename: 'ambiance.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1536,
      tags: [],
      correlationId: makeCorrelationId('upload-ambiance'),
      userId: makeUserId('integration-test-user'),
      timestamp: TEST_DATE,
    })

    const frontMedia = await runPromise(
      mediaRegistrationHandler(frontUploadCommand)
        .pipe(provide(testCtx.layer))
    )

    const detailMedia = await runPromise(
      mediaRegistrationHandler(detailUploadCommand)
        .pipe(provide(testCtx.layer))
    )

    const ambianceMedia = await runPromise(
      mediaRegistrationHandler(ambianceUploadCommand)
        .pipe(provide(testCtx.layer))
    )

    // Verify: All media are PENDING after upload
    expect(frontMedia.status).toBe(MediaStatus.PENDING)
    expect(detailMedia.status).toBe(MediaStatus.PENDING)
    expect(ambianceMedia.status).toBe(MediaStatus.PENDING)

    // ============================================
    // STEP 2: Create a PilotProduct referencing the uploaded media
    // ============================================

    const productCommand = makePilotProductCreationCommand({
      data: {
        label: 'Tapis Berbère Atlas',
        type: ProductType.TAPIS,
        category: ProductCategory.RUNNER,
        description: 'Beautiful handmade Berber rug',
        priceRange: PriceRange.PREMIUM,
        variants: [{ size: Size.REGULAR }],
        views: [
          { viewType: ViewType.FRONT, imageUrl: frontMedia.externalUrl },
          { viewType: ViewType.DETAIL, imageUrl: detailMedia.externalUrl },
          { viewType: ViewType.AMBIANCE, imageUrl: ambianceMedia.externalUrl },
        ],
        status: ProductStatus.DRAFT,
      },
      correlationId: makeCorrelationId('integration-test-correlation'),
      userId: makeUserId('integration-test-user'),
      timestamp: TEST_DATE,
    })

    const createdProduct = await runPromise(
      pilotProductCreationHandler(productCommand)
        .pipe(provide(testCtx.layer))
    )

    // Verify: Product was created with correct image URLs
    expect(createdProduct.views.front.imageUrl).toBe(frontMedia.externalUrl)
    expect(createdProduct.views.detail.imageUrl).toBe(detailMedia.externalUrl)
    expect(createdProduct.views.additional[0]?.imageUrl).toBe(ambianceMedia.externalUrl)

    // ============================================
    // STEP 3: Verify PilotProductCreated event was emitted
    // ============================================

    expect(testCtx.eventSpy.hasEmitted('PilotProductCreated')).toBe(true)
    const emittedEvent = testCtx.eventSpy.lastEvent

    expect(emittedEvent?._tag).toBe('PilotProductCreated')
    expect(emittedEvent?.productId).toBe(createdProduct.id)

    // ============================================
    // STEP 4: Simulate consumer processing the event
    // ============================================

    if (emittedEvent?._tag === 'PilotProductCreated') {
      await runPromise(mediaConfirmationHandler(emittedEvent)
        .pipe(provide(testCtx.layer)))
    }

    // ============================================
    // STEP 5: Verify media are now CONFIRMED
    // ============================================

    const confirmedFrontMedia = await runPromise(
      gen(function* () {
        const repo = yield* MediaRepository
        return yield* repo.getById(frontMedia.mediaId)
      })
        .pipe(provide(testCtx.layer))
    )

    const confirmedDetailMedia = await runPromise(
      gen(function* () {
        const repo = yield* MediaRepository
        return yield* repo.getById(detailMedia.mediaId)
      })
        .pipe(provide(testCtx.layer))
    )

    const confirmedAmbianceMedia = await runPromise(
      gen(function* () {
        const repo = yield* MediaRepository
        return yield* repo.getById(ambianceMedia.mediaId)
      })
        .pipe(provide(testCtx.layer))
    )

    expect(confirmedFrontMedia.status).toBe(MediaStatus.CONFIRMED)
    expect(confirmedDetailMedia.status).toBe(MediaStatus.CONFIRMED)
    expect(confirmedAmbianceMedia.status).toBe(MediaStatus.CONFIRMED)
  })

  it('handles multiple products referencing same media (idempotence)', async () => {
    // ============================================
    // STEP 1: Upload one media file
    // ============================================

    const uploadCommand = makeRegisterMediaCommand({
      externalUrl: 'https://cdn.example.com/images/shared.jpg',
      filename: 'shared.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024,
      tags: [],
      correlationId: makeCorrelationId('upload-shared'),
      userId: makeUserId('integration-test-user'),
      timestamp: TEST_DATE,
    })

    const media = await runPromise(
      mediaRegistrationHandler(uploadCommand)
        .pipe(provide(testCtx.layer))
    )

    expect(media.status).toBe(MediaStatus.PENDING)

    // ============================================
    // STEP 2: Create first product referencing the media
    // ============================================

    const product1Command = makePilotProductCreationCommand({
      data: {
        label: 'Product 1',
        type: ProductType.TAPIS,
        category: ProductCategory.STANDARD,
        description: 'First product',
        priceRange: PriceRange.STANDARD,
        variants: [{ size: Size.REGULAR }],
        views: [
          { viewType: ViewType.FRONT, imageUrl: media.externalUrl },
          { viewType: ViewType.DETAIL, imageUrl: media.externalUrl },
        ],
        status: ProductStatus.DRAFT,
      },
      correlationId: makeCorrelationId('test-corr-1'),
      userId: makeUserId('test-user'),
      timestamp: TEST_DATE,
    })

    await runPromise(pilotProductCreationHandler(product1Command)
      .pipe(provide(testCtx.layer)))

    // Process event
    const event1 = testCtx.eventSpy.lastEvent
    if (event1?._tag === 'PilotProductCreated') {
      await runPromise(mediaConfirmationHandler(event1)
        .pipe(provide(testCtx.layer)))
    }

    // Verify: Media is CONFIRMED
    const confirmedMedia = await runPromise(
      gen(function* () {
        const repo = yield* MediaRepository
        return yield* repo.getById(media.mediaId)
      })
        .pipe(provide(testCtx.layer))
    )

    expect(confirmedMedia.status).toBe(MediaStatus.CONFIRMED)

    testCtx.eventSpy.clear()

    // ============================================
    // STEP 3: Create second product referencing same media
    // ============================================

    const product2Command = makePilotProductCreationCommand({
      data: {
        label: 'Product 2',
        type: ProductType.TAPIS,
        category: ProductCategory.RUNNER,
        description: 'Second product',
        priceRange: PriceRange.PREMIUM,
        variants: [{ size: Size.LARGE }],
        views: [
          { viewType: ViewType.FRONT, imageUrl: media.externalUrl },
          { viewType: ViewType.DETAIL, imageUrl: media.externalUrl },
        ],
        status: ProductStatus.DRAFT,
      },
      correlationId: makeCorrelationId('test-corr-2'),
      userId: makeUserId('test-user'),
      timestamp: TEST_DATE,
    })

    await runPromise(pilotProductCreationHandler(product2Command)
      .pipe(provide(testCtx.layer)))

    // Process event again (idempotence test)
    const event2 = testCtx.eventSpy.lastEvent
    if (event2?._tag === 'PilotProductCreated') {
      await runPromise(mediaConfirmationHandler(event2)
        .pipe(provide(testCtx.layer)))
    }

    // Verify: Media is still CONFIRMED (no error, idempotent)
    const stillConfirmedMedia = await runPromise(
      gen(function* () {
        const repo = yield* MediaRepository
        return yield* repo.getById(media.mediaId)
      })
        .pipe(provide(testCtx.layer))
    )

    expect(stillConfirmedMedia.status).toBe(MediaStatus.CONFIRMED)
  })
})
