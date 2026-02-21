'use server'

import * as Exit from 'effect/Exit'

import { runApi } from '@/lib/api-client'

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

  return { error: "Erreur lors de l'enregistrement du média" }
}
