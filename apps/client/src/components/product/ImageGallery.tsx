'use client'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'

import { viewTypeLabels } from './constants'

import { VIEW_TYPE_OPTIONS } from '@/contexts/ProductFormContext'
import { tokens } from '@/theme/theme'
import type { UploadedImage, UploadingImage } from '@/hooks/useImageUpload'

interface Props {
  uploadingImages: UploadingImage[]
  uploadedImages: UploadedImage[]
  viewTypes: Record<string, string>
  onViewTypeChange: (mediaId: string, viewType: string) => void
  onClickUpload: () => void
}

export default function ImageGallery({
  uploadingImages,
  uploadedImages,
  viewTypes,
  onViewTypeChange,
  onClickUpload,
}: Props) {
  return (
    <Grid container spacing={1.5}>
      {/* Uploading images */}
      {uploadingImages.map((img) => (
        <Grid key={img.id} size={{ xs: 6, sm: 4, md: 3 }}>
          <Box
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
            <Typography variant="caption" sx={{ textAlign: 'center', wordBreak: 'break-all' }}>
              {img.filename}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={img.progress}
              sx={{ width: '100%', mt: 0.5 }}
            />
          </Box>
        </Grid>
      ))}

      {/* Uploaded images with qualification */}
      {uploadedImages.map((img, i) => {
        const currentViewType =
          viewTypes[img.mediaId] ?? (i === 0 ? 'FRONT' : i === 1 ? 'DETAIL' : 'AMBIANCE')

        return (
          <Grid key={img.mediaId} size={{ xs: 6, sm: 4, md: 3 }}>
            <Box>
              <Box sx={{ aspectRatio: '1', overflow: 'hidden' }}>
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
              <FormControl fullWidth size="small" variant="standard" sx={{ mt: 0.75 }}>
                <Select
                  value={currentViewType}
                  onChange={(e) => onViewTypeChange(img.mediaId, e.target.value)}
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
          </Grid>
        )
      })}

      {/* Placeholders */}
      {uploadedImages.length === 0 &&
        uploadingImages.length === 0 &&
        Array.from({ length: 4 }).map((_, i) => (
          <Grid key={i} size={{ xs: 6, sm: 4, md: 3 }}>
            <Box
              onClick={onClickUpload}
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
          </Grid>
        ))}
    </Grid>
  )
}
