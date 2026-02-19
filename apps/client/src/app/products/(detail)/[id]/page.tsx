import { notFound } from 'next/navigation'
import { Cause, Exit } from 'effect'

import { runApi } from '@/lib/api-client'
import { throwApiError } from '@/lib/throw-api-error'
import ProductEditorContent from '@/components/product/ProductEditorContent'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params

  const exit = await runApi((client) => client['pilot-product'].getById({ path: { id } }))

  if (Exit.isSuccess(exit)) {
    return <ProductEditorContent product={exit.value} />
  }

  const failure = Cause.failureOption(exit.cause)
  if (failure._tag === 'Some' && failure.value._tag === 'ApiNotFoundError') {
    notFound()
  }
  throwApiError('Impossible de charger le produit', failure)
}
