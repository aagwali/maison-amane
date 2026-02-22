'use client'

import { useRef } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'

import { useProductForm } from '@/contexts/ProductFormContext'

export default function ProductEditorContent() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    uploadedImages,
    uploadingImages,
    error,
    isDragOver,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelect,
  } = useProductForm()

  return (
    <Box>
      {/* Upload zone */}
      <Box
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          border: '2px dashed',
          borderColor: isDragOver ? 'primary.main' : 'secondary.main',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          mb: 4,
          bgcolor: isDragOver ? 'action.hover' : 'background.paper',
          color: 'text.secondary',
          gap: 1,
          cursor: 'pointer',
          transition: 'border-color 0.2s ease, background-color 0.2s ease',
        }}
      >
        <CloudUploadIcon
          sx={{ fontSize: 48, color: isDragOver ? 'primary.main' : 'secondary.main' }}
        />
        <Typography variant="h6" color="text.primary">
          {isDragOver ? 'Déposez vos images ici' : 'Drag & Drop Upload Zone'}
        </Typography>
        {!isDragOver && (
          <Typography variant="body2">
            Cliquez ou déposez des images (JPEG, PNG, WebP · max 10 MB)
          </Typography>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={onFileSelect}
      />

      {/* Feedback erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Gallery */}
      <Typography variant="h6" gutterBottom>
        Gallery
      </Typography>
      <Grid container spacing={1.5}>
        {/* Images en cours d'upload */}
        {uploadingImages.map((img) => (
          <Grid key={img.id} size={{ xs: 6, sm: 4, md: 3 }}>
            <Box
              sx={{
                aspectRatio: '4 / 3',
                bgcolor: 'secondary.main',
                opacity: 0.4,
                borderRadius: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              <CircularProgress variant="determinate" value={img.progress} size={32} />
              <Typography
                variant="caption"
                sx={{ px: 1, textAlign: 'center', wordBreak: 'break-all' }}
              >
                {img.filename}
              </Typography>
            </Box>
          </Grid>
        ))}

        {/* Images uploadées */}
        {uploadedImages.map((img) => (
          <Grid key={img.mediaId} size={{ xs: 6, sm: 4, md: 3 }}>
            <Box
              component="img"
              src={img.imageUrl}
              alt={img.filename}
              sx={{
                width: '100%',
                aspectRatio: '4 / 3',
                objectFit: 'cover',
                borderRadius: 1,
                display: 'block',
              }}
            />
          </Grid>
        ))}

        {/* Placeholders si galerie vide */}
        {uploadedImages.length === 0 &&
          uploadingImages.length === 0 &&
          Array.from({ length: 8 }).map((_, i) => (
            <Grid key={i} size={{ xs: 6, sm: 4, md: 3 }}>
              <Box
                sx={{
                  aspectRatio: '4 / 3',
                  bgcolor: 'secondary.main',
                  opacity: 0.2,
                  borderRadius: 1,
                }}
              />
            </Grid>
          ))}
      </Grid>
    </Box>
  )
}
