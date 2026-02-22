import type { UploadedImage } from '@/hooks/useImageUpload'
import { runApiPage } from '@/lib/api-client'
import ProductDetailShell from '@/components/product/ProductDetailShell'
import ProductEditorContent from '@/components/product/ProductEditorContent'

interface Props {
  params: Promise<{ id: string }>
}

interface ViewDto {
  viewType: string
  imageUrl: string
}

function viewsToImages(views: {
  front: ViewDto
  detail: ViewDto
  additional: readonly ViewDto[]
}): UploadedImage[] {
  const all = [views.front, views.detail, ...views.additional]
  return all.map((v) => ({
    mediaId: v.imageUrl,
    imageUrl: v.imageUrl,
    filename: v.viewType.toLowerCase(),
  }))
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const product = await runApiPage((client) => client['pilot-product'].getById({ path: { id } }), {
    notFoundOn: 'ApiNotFoundError',
  })

  const initialData = {
    id: product.id,
    title: product.label,
    images: viewsToImages(product.views),
  }

  return (
    <ProductDetailShell initialData={initialData} key={id}>
      <ProductEditorContent />
    </ProductDetailShell>
  )
}
