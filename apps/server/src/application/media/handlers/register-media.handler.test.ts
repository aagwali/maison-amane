// src/application/media/handlers/register-media.handler.test.ts

import { describe, it, expect } from 'vitest'
import { runPromise, provide } from 'effect/Effect'

import { MediaStatus } from '../../../domain/media'
import { makeCorrelationId, makeUserId } from '../../../domain/shared'
import { provideTestLayer, TEST_DATE } from '../../../test-utils/test-layer'
import { makeRegisterMediaCommand } from '../commands/register-media.command'

import { mediaRegistrationHandler } from './register-media.handler'

describe('mediaRegistrationHandler', () => {
  it('creates media with PENDING status', async () => {
    const { layer } = provideTestLayer()

    const command = makeRegisterMediaCommand({
      externalUrl: 'https://cdn.example.com/images/product-photo.jpg',
      filename: 'product-photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024,
      tags: ['product', 'main'],
      correlationId: makeCorrelationId('test-correlation-1'),
      userId: makeUserId('user-123'),
      timestamp: new Date(),
    })

    const media = await runPromise(mediaRegistrationHandler(command)
      .pipe(provide(layer)))

    expect(media.status).toBe(MediaStatus.PENDING)
    expect(media.uploadedAt).toEqual(TEST_DATE)
    expect(media.mimeType).toBe('image/jpeg')
    expect(media.fileSize).toBe(1024)
    expect(media.tags).toEqual(['product', 'main'])
  })

  it('generates deterministic mediaId', async () => {
    const { layer } = provideTestLayer()

    const command = makeRegisterMediaCommand({
      externalUrl: 'https://cdn.example.com/images/product-photo.jpg',
      filename: 'product-photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024,
      tags: [],
      correlationId: makeCorrelationId('test-correlation-1'),
      userId: makeUserId('user-123'),
      timestamp: new Date(),
    })

    const media = await runPromise(mediaRegistrationHandler(command)
      .pipe(provide(layer)))

    expect(media.mediaId).toBe('test-media-1')
  })

  it('registers media with provided externalUrl', async () => {
    const { layer } = provideTestLayer()

    const command = makeRegisterMediaCommand({
      externalUrl: 'https://cdn.example.com/images/product-photo.jpg',
      filename: 'product-photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024,
      tags: [],
      correlationId: makeCorrelationId('test-correlation-1'),
      userId: makeUserId('user-123'),
      timestamp: new Date(),
    })

    const media = await runPromise(mediaRegistrationHandler(command)
      .pipe(provide(layer)))

    expect(media.externalUrl).toBe('https://cdn.example.com/images/product-photo.jpg')
  })
})
