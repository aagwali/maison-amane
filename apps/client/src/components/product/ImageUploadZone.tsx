'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded'
import { alpha } from '@mui/material/styles'
import type { DragEvent } from 'react'

import { tokens } from '@/theme/theme'

interface Props {
  isDragOver: boolean
  onDragOver: (e: DragEvent<HTMLDivElement>) => void
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void
  onDrop: (e: DragEvent<HTMLDivElement>) => void
  onClickUpload: () => void
}

export default function ImageUploadZone({
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onClickUpload,
}: Props) {
  return (
    <Box
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClickUpload}
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
        {!isDragOver && <Typography variant="caption">JPEG, PNG, WebP — max 10 Mo</Typography>}
      </Box>
    </Box>
  )
}
