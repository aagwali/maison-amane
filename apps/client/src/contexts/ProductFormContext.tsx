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
  description?: string
  type?: string
  category?: string
  priceRange?: string
  size?: string
  status?: string
  viewTypes?: Record<string, string>
}

type ProductFormMode = 'create' | 'edit'

export const VIEW_TYPE_OPTIONS = ['FRONT', 'BACK', 'DETAIL', 'AMBIANCE'] as const
export const PRODUCT_TYPE_OPTIONS = ['TAPIS', 'COUSSIN', 'POUF'] as const
export const CATEGORY_OPTIONS = ['STANDARD', 'PREMIUM', 'COLLECTION'] as const
export const PRICE_RANGE_OPTIONS = ['ECONOMIQUE', 'STANDARD', 'PREMIUM', 'LUXE'] as const
export const SIZE_OPTIONS = ['PETIT', 'REGULAR', 'GRAND', 'SUR_MESURE'] as const

interface ProductFormContextValue extends UseImageUploadReturn {
  title: string
  setTitle: (title: string) => void
  description: string
  setDescription: (desc: string) => void
  productType: string
  setProductType: (t: string) => void
  category: string
  setCategory: (c: string) => void
  priceRange: string
  setPriceRange: (p: string) => void
  size: string
  setSize: (s: string) => void
  viewTypes: Record<string, string>
  setImageViewType: (imageId: string, viewType: string) => void
  mode: ProductFormMode
  productStatus: string | undefined
  canSave: boolean
  canPublish: boolean
  isSaving: boolean
  saveError: string | null
  saveProduct: (publish?: boolean) => void
}

const ProductFormContext = createContext<ProductFormContextValue | null>(null)

function imagesToViews(images: UploadedImage[], viewTypes: Record<string, string>) {
  return images.map((img, i) => ({
    viewType: viewTypes[img.mediaId] ?? (i === 0 ? 'FRONT' : i === 1 ? 'DETAIL' : 'AMBIANCE'),
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
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [productType, setProductType] = useState(initialData?.type ?? 'TAPIS')
  const [category, setCategory] = useState(initialData?.category ?? 'STANDARD')
  const [priceRange, setPriceRange] = useState(initialData?.priceRange ?? 'STANDARD')
  const [size, setSize] = useState(initialData?.size ?? 'REGULAR')
  const [viewTypes, setViewTypes] = useState<Record<string, string>>(initialData?.viewTypes ?? {})
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const setImageViewType = useCallback((imageId: string, viewType: string) => {
    setViewTypes((prev) => ({ ...prev, [imageId]: viewType }))
  }, [])

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

  const canPublish =
    !isSaving &&
    initialData?.status === 'DRAFT' &&
    title.trim() !== '' &&
    imageUpload.uploadedImages.length >= 2

  const saveProduct = useCallback(
    async (publish = false) => {
      if (publish ? !canPublish : !canSave) return

      setIsSaving(true)
      setSaveError(null)

      try {
        if (mode === 'create') {
          const payload = {
            label: title.trim(),
            type: productType,
            category,
            description: description.trim(),
            priceRange,
            variants: [{ size }],
            views: imagesToViews(imageUpload.uploadedImages, viewTypes),
            status: publish ? 'PUBLISHED' : 'PUBLISHED', // API currently requires PUBLISHED
          }

          const result = await createProduct(payload)
          if ('error' in result) setSaveError(result.error)
          else router.push(`/products/${result.id}`)
        } else {
          const result = await updateProduct(initialData!.id, {
            label: title.trim(),
            views: imagesToViews(imageUpload.uploadedImages, viewTypes),
            ...(publish ? { status: 'PUBLISHED' } : {}),
          })
          if ('error' in result) setSaveError(result.error)
          else router.refresh()
        }
      } finally {
        setIsSaving(false)
      }
    },
    [
      canSave,
      canPublish,
      mode,
      title,
      description,
      productType,
      category,
      priceRange,
      size,
      imageUpload.uploadedImages,
      viewTypes,
      router,
      initialData,
    ]
  )

  const value = useMemo<ProductFormContextValue>(
    () => ({
      ...imageUpload,
      title,
      setTitle,
      description,
      setDescription,
      productType,
      setProductType,
      category,
      setCategory,
      priceRange,
      setPriceRange,
      size,
      setSize,
      viewTypes,
      setImageViewType,
      mode,
      productStatus: initialData?.status,
      canSave,
      canPublish,
      isSaving,
      saveError,
      saveProduct,
    }),
    [
      imageUpload,
      title,
      description,
      productType,
      category,
      priceRange,
      size,
      viewTypes,
      setImageViewType,
      mode,
      initialData?.status,
      canSave,
      canPublish,
      isSaving,
      saveError,
      saveProduct,
    ]
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
