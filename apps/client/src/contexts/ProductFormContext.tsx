'use client'

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { useImageUpload, type UseImageUploadReturn } from '@/hooks/useImageUpload'
import { createProduct } from '@/app/products/actions'

interface ProductFormContextValue extends UseImageUploadReturn {
  title: string
  setTitle: (title: string) => void
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

export function ProductFormProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const imageUpload = useImageUpload()

  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const canSave = title.trim() !== '' && imageUpload.uploadedImages.length >= 2 && !isSaving

  const saveProduct = useCallback(async () => {
    if (!canSave) return

    setIsSaving(true)
    setSaveError(null)

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

    try {
      const result = await createProduct(payload)
      if ('error' in result) setSaveError(result.error)
      else router.push(`/products/${result.id}`)
    } finally {
      setIsSaving(false)
    }
  }, [canSave, title, imageUpload.uploadedImages, router])

  const value = useMemo<ProductFormContextValue>(
    () => ({
      ...imageUpload,
      title,
      setTitle,
      canSave,
      isSaving,
      saveError,
      saveProduct,
    }),
    [imageUpload, title, canSave, isSaving, saveError, saveProduct]
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
