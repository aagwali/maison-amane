import { runApiPage } from '@/lib/api-client'
import ProductEditorContent from '@/components/product/ProductEditorContent'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const product = await runApiPage((client) => client['pilot-product'].getById({ path: { id } }), {
    notFoundOn: 'ApiNotFoundError',
  })
  return <ProductEditorContent product={product} />
}
