'use server'

import type { CreatePilotProductRequest, UpdatePilotProductRequest } from '@maison-amane/api'
import * as Cause from 'effect/Cause'
import * as Exit from 'effect/Exit'

import { runApi } from '@/lib/api-client'
import { logger } from '@/lib/logger'

export async function registerMedia(input: {
  externalUrl: string
  filename: string
  mimeType: string
  fileSize: number
}): Promise<{ mediaId: string; imageUrl: string } | { error: string }> {
  const exit = await runApi((client) => client['media'].register({ payload: input }))

  if (Exit.isSuccess(exit)) {
    return exit.value
  }

  logger.error('registerMedia failed', {
    cause: Cause.pretty(exit.cause),
    filename: input.filename,
  })
  return { error: "Erreur lors de l'enregistrement du média" }
}

export async function createProduct(
  input: CreatePilotProductRequest
): Promise<{ id: string } | { error: string }> {
  const exit = await runApi((client) => client['pilot-product'].create({ payload: input }))

  if (Exit.isSuccess(exit)) {
    return { id: exit.value.id }
  }

  logger.error('createProduct failed', { cause: Cause.pretty(exit.cause), label: input.label })
  return { error: 'Erreur lors de la création du produit' }
}

export async function updateProduct(
  id: string,
  input: UpdatePilotProductRequest
): Promise<{ success: true } | { error: string }> {
  const exit = await runApi((client) =>
    client['pilot-product'].update({ path: { id }, payload: input })
  )

  if (Exit.isSuccess(exit)) {
    return { success: true }
  }

  logger.error('updateProduct failed', { cause: Cause.pretty(exit.cause), id })
  return { error: 'Erreur lors de la mise à jour du produit' }
}
