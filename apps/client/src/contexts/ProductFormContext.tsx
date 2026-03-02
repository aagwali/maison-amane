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
  shape?: string
  material?: string
  sizes?: string[]
  status?: string
  viewTypes?: Record<string, string>
}

type ProductFormMode = 'create' | 'edit'

export const VIEW_TYPE_OPTIONS = ['FRONT', 'BACK', 'DETAIL', 'AMBIANCE'] as const
export const PRODUCT_TYPE_OPTIONS = ['TAPIS'] as const
export const SHAPE_OPTIONS = ['STANDARD', 'RUNNER'] as const
export const MATERIAL_OPTIONS = ['MTIRT', 'BENI_OUARAIN', 'AZILAL'] as const
export const SIZE_OPTIONS = ['EXTRA_SMALL', 'SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE'] as const
export const RUNNER_SIZE_OPTIONS = ['MEDIUM', 'LARGE'] as const

function defaultSizesForShape(shape: string): string[] {
  return shape === 'RUNNER' ? [...RUNNER_SIZE_OPTIONS] : [...SIZE_OPTIONS]
}

interface ProductFormContextValue extends UseImageUploadReturn {
  title: string
  setTitle: (title: string) => void
  description: string
  setDescription: (desc: string) => void
  productType: string
  setProductType: (t: string) => void
  shape: string
  setShape: (s: string) => void
  material: string
  setMaterial: (m: string) => void
  sizes: string[]
  setSizes: (s: string[]) => void
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
  const [shape, setShapeRaw] = useState(initialData?.shape ?? 'STANDARD')
  const [material, setMaterial] = useState(initialData?.material ?? 'MTIRT')
  const [sizes, setSizes] = useState<string[]>(
    initialData?.sizes ?? defaultSizesForShape(initialData?.shape ?? 'STANDARD')
  )

  const setShape = useCallback((s: string) => {
    setShapeRaw(s)
    setSizes(defaultSizesForShape(s))
  }, [])
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
      description.trim() !== (initialData.description ?? '') ||
      productType !== (initialData.type ?? 'TAPIS') ||
      shape !== (initialData.shape ?? 'STANDARD') ||
      material !== (initialData.material ?? 'MTIRT') ||
      JSON.stringify([...sizes].sort()) !==
        JSON.stringify(
          [...(initialData.sizes ?? defaultSizesForShape(initialData.shape ?? 'STANDARD'))].sort()
        ) ||
      hasImageChanges(imageUpload.uploadedImages, initialData.images) ||
      JSON.stringify(viewTypes) !== JSON.stringify(initialData.viewTypes ?? {}))

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
            shape,
            description: description.trim(),
            material,
            variants: sizes.map((s) => ({ size: s })),
            views: imagesToViews(imageUpload.uploadedImages, viewTypes),
            status: publish ? 'PUBLISHED' : 'PUBLISHED', // API currently requires PUBLISHED
          }

          const result = await createProduct(payload)
          if ('error' in result) setSaveError(result.error)
          else router.push(`/products/${result.id}`)
        } else {
          const result = await updateProduct(initialData!.id, {
            label: title.trim(),
            type: productType,
            shape,
            description: description.trim(),
            material,
            variants: sizes.map((s) => ({ size: s })),
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
      shape,
      material,
      sizes,
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
      shape,
      setShape,
      material,
      setMaterial,
      sizes,
      setSizes,
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
      shape,
      material,
      sizes,
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
