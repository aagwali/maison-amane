'use client'

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import {
  useImageUpload,
  type UploadedImage,
  type UseImageUploadReturn,
} from '@/hooks/useImageUpload'
import { createProduct, updateProduct } from '@/app/products/actions'

export interface ProductFormInitialData {
  id: string
  title: string
  images: UploadedImage[]
}

type ProductFormMode = 'create' | 'edit'

interface ProductFormContextValue extends UseImageUploadReturn {
  title: string
  setTitle: (title: string) => void
  mode: ProductFormMode
  canSave: boolean
  isSaving: boolean
  saveError: string | null
  saveProduct: () => void
}

const ProductFormContext = createContext<ProductFormContextValue | null>(null)

const VIEW_TYPES = ['FRONT', 'DETAIL', 'AMBIANCE'] as const

function imagesToViews(images: { imageUrl: string }[]) {
  return images.map((img, i) => ({
    viewType: i < 2 ? VIEW_TYPES[i] : VIEW_TYPES[2],
    imageUrl: img.imageUrl,
  }))
}

function hasImageChanges(current: UploadedImage[], initial: UploadedImage[]): boolean {
  if (current.length !== initial.length) return true
  return current.some((img, i) => img.imageUrl !== initial[i].imageUrl)
}

interface ProductFormProviderProps {
  initialData?: ProductFormInitialData
  children: ReactNode
}

export function ProductFormProvider({ initialData, children }: ProductFormProviderProps) {
  const router = useRouter()
  const mode: ProductFormMode = initialData ? 'edit' : 'create'
  const imageUpload = useImageUpload(initialData?.images)

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const hasChanges =
    mode === 'edit' &&
    initialData != null &&
    (title.trim() !== initialData.title ||
      hasImageChanges(imageUpload.uploadedImages, initialData.images))

  const canSave =
    !isSaving &&
    (mode === 'create'
      ? title.trim() !== '' && imageUpload.uploadedImages.length >= 2
      : hasChanges && title.trim() !== '' && imageUpload.uploadedImages.length >= 2)

  const saveProduct = useCallback(async () => {
    if (!canSave) return

    setIsSaving(true)
    setSaveError(null)

    try {
      if (mode === 'create') {
        const payload = {
          label: title.trim(),
          type: 'TAPIS',
          category: 'STANDARD',
          description: '',
          priceRange: 'STANDARD',
          variants: [{ size: 'REGULAR' }],
          views: imagesToViews(imageUpload.uploadedImages),
          status: 'PUBLISHED',
        }

        const result = await createProduct(payload)
        if ('error' in result) setSaveError(result.error)
        else router.push(`/products/${result.id}`)
      } else {
        const result = await updateProduct(initialData!.id, {
          label: title.trim(),
          views: imagesToViews(imageUpload.uploadedImages),
        })
        if ('error' in result) setSaveError(result.error)
        else router.refresh()
      }
    } finally {
      setIsSaving(false)
    }
  }, [canSave, mode, title, imageUpload.uploadedImages, router, initialData])

  const value = useMemo<ProductFormContextValue>(
    () => ({
      ...imageUpload,
      title,
      setTitle,
      mode,
      canSave,
      isSaving,
      saveError,
      saveProduct,
    }),
    [imageUpload, title, mode, canSave, isSaving, saveError, saveProduct]
  )

  return <ProductFormContext.Provider value={value}>{children}</ProductFormContext.Provider>
}

export function useProductForm(): ProductFormContextValue {
  const ctx = useContext(ProductFormContext)
  if (!ctx) {
    throw new Error('useProductForm must be used within a ProductFormProvider')
  }
  return ctx
}
