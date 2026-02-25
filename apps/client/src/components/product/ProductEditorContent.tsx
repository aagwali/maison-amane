'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import PublishRoundedIcon from '@mui/icons-material/PublishRounded'
import Link from 'next/link'
import { alpha } from '@mui/material/styles'

import {
  useProductForm,
  VIEW_TYPE_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
  CATEGORY_OPTIONS,
  PRICE_RANGE_OPTIONS,
  SIZE_OPTIONS,
} from '@/contexts/ProductFormContext'
import { tokens } from '@/theme/theme'

const viewTypeLabels: Record<string, string> = {
  FRONT: 'Face',
  BACK: 'Dos',
  DETAIL: 'Détail',
  AMBIANCE: 'Ambiance',
}

const typeLabels: Record<string, string> = {
  TAPIS: 'Tapis',
  COUSSIN: 'Coussin',
  POUF: 'Pouf',
}

const categoryLabels: Record<string, string> = {
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
  COLLECTION: 'Collection',
}

const priceLabels: Record<string, string> = {
  ECONOMIQUE: 'Économique',
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
  LUXE: 'Luxe',
}

const sizeLabels: Record<string, string> = {
  PETIT: 'Petit',
  REGULAR: 'Régulier',
  GRAND: 'Grand',
  SUR_MESURE: 'Sur mesure',
}

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
      {/* Header */}
      <Box
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
          px: { xs: 2.5, md: 4 },
          py: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: 1400,
            mx: 'auto',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton
              component={Link}
              href="/products"
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <ArrowBackRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Box>
              <Typography variant="overline" sx={{ lineHeight: 1.2, display: 'block' }}>
                {isEdit ? 'Modifier' : 'Nouveau produit'}
              </Typography>
              <Typography variant="h4" sx={{ lineHeight: 1.2 }}>
                {title || 'Sans titre'}
              </Typography>
            </Box>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="text" size="small" onClick={() => router.push('/products')}>
              Annuler
            </Button>
            <Button
              variant="contained"
              size="small"
              disabled={!canSave}
              onClick={() => saveProduct(false)}
              startIcon={
                isSaving ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <SaveRoundedIcon sx={{ fontSize: 18 }} />
                )
              }
              sx={{ minWidth: 186, whiteSpace: 'nowrap' }}
            >
              {isSaving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
            {(!isEdit || productStatus === 'DRAFT') && (
              <Button
                variant="contained"
                size="small"
                disabled={isEdit ? !canPublish : !canSave}
                onClick={() => saveProduct(true)}
                startIcon={<PublishRoundedIcon sx={{ fontSize: 18 }} />}
                sx={{
                  bgcolor: tokens.olive,
                  '&:hover': { bgcolor: tokens.oliveDark },
                }}
              >
                Publier
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Main content — two columns */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: { xs: 2.5, md: 4 },
          py: 2,
        }}
      >
        {/* Save error — dans la zone scrollable pour ne pas déplacer le layout */}
        {saveError && (
          <Alert severity="error" sx={{ mb: 2, maxWidth: 1400, mx: 'auto' }}>
            {saveError}
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 360px' },
            gap: 2,
            maxWidth: 1400,
            mx: 'auto',
          }}
        >
          {/* Left column — Images */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Images
            </Typography>

            {/* Upload zone */}
            <Box
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '1px dashed',
                borderColor: isDragOver ? 'primary.main' : tokens.ash,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 3,
                px: 3,
                mb: 3,
                bgcolor: isDragOver ? alpha(tokens.ember, 0.03) : 'transparent',
                color: 'text.secondary',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease, background-color 0.15s ease',
                '&:hover': {
                  borderColor: tokens.silver,
                },
              }}
            >
              <CloudUploadRoundedIcon
                sx={{
                  fontSize: 24,
                  color: isDragOver ? 'primary.main' : tokens.silver,
                  transition: 'color 0.15s ease',
                }}
              />
              <Box>
                <Typography variant="body2" color="text.primary">
                  {isDragOver ? 'Déposez ici' : 'Glissez vos images ou cliquez'}
                </Typography>
                {!isDragOver && (
                  <Typography variant="caption">JPEG, PNG, WebP — max 10 Mo</Typography>
                )}
              </Box>
            </Box>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={onFileSelect}
            />

            {/* Upload error */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Image count requirement */}
            {needsMoreImages && uploadedImages.length > 0 && (
              <Typography variant="caption" color="warning.main" sx={{ mb: 2, display: 'block' }}>
                {uploadedImages.length}/2 images minimum requises
              </Typography>
            )}

            {/* Gallery */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(3, 1fr)',
                  md: 'repeat(4, 1fr)',
                },
                gap: 1.5,
              }}
            >
              {/* Uploading images */}
              {uploadingImages.map((img) => (
                <Box
                  key={img.id}
                  sx={{
                    aspectRatio: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <CircularProgress
                    variant="determinate"
                    value={img.progress}
                    size={24}
                    sx={{ color: 'primary.main' }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ textAlign: 'center', wordBreak: 'break-all' }}
                  >
                    {img.filename}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={img.progress}
                    sx={{ width: '100%', mt: 0.5 }}
                  />
                </Box>
              ))}

              {/* Uploaded images with qualification */}
              {uploadedImages.map((img, i) => {
                const currentViewType =
                  viewTypes[img.mediaId] ?? (i === 0 ? 'FRONT' : i === 1 ? 'DETAIL' : 'AMBIANCE')

                return (
                  <Box key={img.mediaId}>
                    <Box
                      sx={{
                        aspectRatio: '1',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        component="img"
                        src={img.imageUrl}
                        alt={img.filename}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </Box>
                    {/* View type selector — border-bottom only */}
                    <FormControl fullWidth size="small" variant="standard" sx={{ mt: 0.75 }}>
                      <Select
                        value={currentViewType}
                        onChange={(e) => setImageViewType(img.mediaId, e.target.value)}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        {VIEW_TYPE_OPTIONS.map((vt) => (
                          <MenuItem key={vt} value={vt} sx={{ fontSize: '0.75rem' }}>
                            {viewTypeLabels[vt] ?? vt}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                )
              })}

              {/* Placeholders */}
              {uploadedImages.length === 0 &&
                uploadingImages.length === 0 &&
                Array.from({ length: 4 }).map((_, i) => (
                  <Box
                    key={i}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      aspectRatio: '1',
                      border: '1px dashed',
                      borderColor: tokens.ash,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s ease',
                      '&:hover': {
                        borderColor: tokens.silver,
                      },
                    }}
                  >
                    <CloudUploadRoundedIcon sx={{ fontSize: 24, color: tokens.ash }} />
                  </Box>
                ))}
            </Box>
          </Box>

          {/* Right column — Details form */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Informations
            </Typography>

            <Box>
              {/* Title */}
              <TextField
                label="Titre du produit"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ mb: 2.5 }}
                placeholder="ex: Tapis Atlas Royal"
              />

              {/* Description */}
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{ mb: 3 }}
                placeholder="Description du produit..."
              />

              <Divider sx={{ mb: 2.5, borderStyle: 'dashed', borderColor: tokens.ash }} />

              <Typography variant="h6" sx={{ mb: 2 }}>
                Classification
              </Typography>

              {/* Type — variant standard : border-bottom uniquement */}
              <FormControl fullWidth size="small" variant="standard" sx={{ mb: 2.5 }}>
                <InputLabel>Type</InputLabel>
                <Select value={productType} onChange={(e) => setProductType(e.target.value)}>
                  {PRODUCT_TYPE_OPTIONS.map((t) => (
                    <MenuItem key={t} value={t}>
                      {typeLabels[t] ?? t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Category */}
              <FormControl fullWidth size="small" variant="standard" sx={{ mb: 2.5 }}>
                <InputLabel>Catégorie</InputLabel>
                <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORY_OPTIONS.map((c) => (
                    <MenuItem key={c} value={c}>
                      {categoryLabels[c] ?? c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Price Range */}
              <FormControl fullWidth size="small" variant="standard" sx={{ mb: 3 }}>
                <InputLabel>Gamme de prix</InputLabel>
                <Select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
                  {PRICE_RANGE_OPTIONS.map((p) => (
                    <MenuItem key={p} value={p}>
                      {priceLabels[p] ?? p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider sx={{ mb: 2.5, borderStyle: 'dashed', borderColor: tokens.ash }} />

              <Typography variant="h6" sx={{ mb: 2 }}>
                Variantes
              </Typography>

              {/* Size */}
              <FormControl fullWidth size="small" variant="standard">
                <InputLabel>Taille</InputLabel>
                <Select value={size} onChange={(e) => setSize(e.target.value)}>
                  {SIZE_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {sizeLabels[s] ?? s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  )
}
