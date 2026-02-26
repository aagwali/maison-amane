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
}): { images: UploadedImage[]; viewTypes: Record<string, string> } {
  const all = [views.front, views.detail, ...views.additional]
  const images = all.map((v) => ({
    mediaId: v.imageUrl,
    imageUrl: v.imageUrl,
    filename: v.viewType.toLowerCase(),
  }))
  const viewTypes: Record<string, string> = {}
  all.forEach((v) => {
    viewTypes[v.imageUrl] = v.viewType
  })
  return { images, viewTypes }
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const product = await runApiPage((client) => client['pilot-product'].getById({ path: { id } }), {
    notFoundOn: 'ApiNotFoundError',
  })

  const { images, viewTypes } = viewsToImages(product.views)

  const initialData = {
    id: product.id,
    title: product.label,
    images,
    viewTypes,
    status: product.status,
  }

  return (
    <ProductDetailShell initialData={initialData} key={id}>
      <ProductEditorContent />
    </ProductDetailShell>
  )
}
