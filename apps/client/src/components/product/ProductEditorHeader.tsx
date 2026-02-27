'use client'

import { alpha } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
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
          {/* Annuler — icon on xs, text on sm+ */}
          <Tooltip title="Annuler">
            <IconButton
              size="small"
              onClick={onCancel}
              sx={{
                display: { xs: 'flex', md: 'none' },
                color: 'text.secondary',
                '&:hover': { bgcolor: alpha(tokens.charcoal, 0.08) },
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="text"
            size="small"
            onClick={onCancel}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            Annuler
          </Button>

          {/* Save — icon on xs, full button on sm+ */}
          <Tooltip title={isSaving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Enregistrer'}>
            <IconButton
              size="small"
              color="primary"
              disabled={!canSave}
              onClick={() => onSave(false)}
              sx={{
                display: { xs: 'flex', md: 'none' },
                '&:hover': { bgcolor: alpha(tokens.ember, 0.1) },
              }}
            >
              {isSaving ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <SaveRoundedIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </Tooltip>
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
            sx={{ display: { xs: 'none', md: 'flex' }, minWidth: 186, whiteSpace: 'nowrap' }}
          >
            {isSaving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Enregistrer'}
          </Button>

          {/* Publish — icon on xs, full button on sm+ */}
          {(!isEdit || productStatus === 'DRAFT') && (
            <>
              <Tooltip title="Publier">
                <IconButton
                  size="small"
                  disabled={isEdit ? !canPublish : !canSave}
                  onClick={() => onSave(true)}
                  sx={{
                    display: { xs: 'flex', md: 'none' },
                    color: tokens.olive,
                    '&:hover': { color: tokens.oliveDark, bgcolor: alpha(tokens.olive, 0.1) },
                  }}
                >
                  <PublishRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                size="small"
                disabled={isEdit ? !canPublish : !canSave}
                onClick={() => onSave(true)}
                startIcon={<PublishRoundedIcon sx={{ fontSize: 18 }} />}
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  bgcolor: tokens.olive,
                  '&:hover': { bgcolor: tokens.oliveDark },
                }}
              >
                Publier
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </Box>
  )
}
