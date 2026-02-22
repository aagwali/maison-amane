import { runApiPage } from '@/lib/api-client'
import ProductEditorContent from '@/components/product/ProductEditorContent'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  // Fetch product to validate it exists (404 if not found)
  await runApiPage((client) => client['pilot-product'].getById({ path: { id } }), {
    notFoundOn: 'ApiNotFoundError',
  })
  // TODO: wire product data into form context for editing
  // TODO: add key={id} here (or on ProductDetailShell in the layout) to force remount of
  // ProductFormProvider when navigating between two product pages — prevents stale images/title
  // from a previous product leaking into the next one.
  return <ProductEditorContent />
}
