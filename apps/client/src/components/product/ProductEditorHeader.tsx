'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import PublishRoundedIcon from '@mui/icons-material/PublishRounded'
import Link from 'next/link'

import { tokens } from '@/theme/theme'

interface Props {
  title: string
  isEdit: boolean
  productStatus: string | undefined
  canSave: boolean
  canPublish: boolean
  isSaving: boolean
  onSave: (publish: boolean) => void
  onCancel: () => void
}

export default function ProductEditorHeader({
  title,
  isEdit,
  productStatus,
  canSave,
  canPublish,
  isSaving,
  onSave,
  onCancel,
}: Props) {
  return (
    <Box
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexShrink: 0,
        px: { xs: 2.5, md: 4 },
        py: 2,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ maxWidth: 1400, mx: 'auto' }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
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
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button variant="text" size="small" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={!canSave}
            onClick={() => onSave(false)}
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
              onClick={() => onSave(true)}
              startIcon={<PublishRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                bgcolor: tokens.olive,
                '&:hover': { bgcolor: tokens.oliveDark },
              }}
            >
              Publier
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  )
}
