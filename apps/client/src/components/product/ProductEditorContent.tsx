'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import ProductEditorHeader from './ProductEditorHeader'
import ImageUploadZone from './ImageUploadZone'
import ImageGallery from './ImageGallery'
import ProductDetailsForm from './ProductDetailsForm'

import { useProductForm } from '@/contexts/ProductFormContext'

export default function ProductEditorContent() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const {
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
    uploadedImages,
    uploadingImages,
    error,
    isDragOver,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelect,
    viewTypes,
    setImageViewType,
    mode,
    productStatus,
    canSave,
    canPublish,
    isSaving,
    saveError,
    saveProduct,
  } = useProductForm()

  const isEdit = mode === 'edit'
  const needsMoreImages = uploadedImages.length < 2

  return (
    <>
      <ProductEditorHeader
        title={title}
        isEdit={isEdit}
        productStatus={productStatus}
        canSave={canSave}
        canPublish={canPublish}
        isSaving={isSaving}
        onSave={saveProduct}
        onCancel={() => router.push('/products')}
      />

      <Box sx={{ flex: 1, overflow: 'auto', px: { xs: 2.5, md: 4 }, py: 2 }}>
        {saveError && (
          <Alert severity="error" sx={{ mb: 2, maxWidth: 1400, mx: 'auto' }}>
            {saveError}
          </Alert>
        )}

        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          sx={{ maxWidth: 1400, mx: 'auto' }}
        >
          {/* Left column — Images */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Images
            </Typography>

            <ImageUploadZone
              isDragOver={isDragOver}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClickUpload={() => fileInputRef.current?.click()}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={onFileSelect}
            />

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {needsMoreImages && uploadedImages.length > 0 && (
              <Typography variant="caption" color="warning.main" sx={{ mb: 2, display: 'block' }}>
                {uploadedImages.length}/2 images minimum requises
              </Typography>
            )}

            <ImageGallery
              uploadingImages={uploadingImages}
              uploadedImages={uploadedImages}
              viewTypes={viewTypes}
              onViewTypeChange={setImageViewType}
              onClickUpload={() => fileInputRef.current?.click()}
            />
          </Box>

          {/* Right column — Details */}
          <Box sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
            <ProductDetailsForm
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              productType={productType}
              setProductType={setProductType}
              category={category}
              setCategory={setCategory}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              size={size}
              setSize={setSize}
            />
          </Box>
        </Stack>
      </Box>
    </>
  )
}
