'use client'

import { useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { alpha } from '@mui/material/styles'

import { tokens } from '@/theme/theme'

interface Props {
  error: Error & { digest?: string; correlationId?: string }
  reset: () => void
}

export default function ProductDetailError({ error, reset }: Props) {
  const { enqueueSnackbar } = useSnackbar()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const ref = error.correlationId ?? error.digest

  useEffect(() => {
    enqueueSnackbar(
      ref ? `Erreur de chargement. Réf\u00a0: ${ref}` : 'Erreur de chargement du produit.',
      { variant: 'error', autoHideDuration: 8000 }
    )
  }, [enqueueSnackbar, ref])

  const handleRetry = () => {
    startTransition(() => {
      router.refresh()
      reset()
    })
  }

  return (
    <Box sx={{ p: { xs: 3, md: 5 }, maxWidth: 520 }}>
      <Box
        sx={{
          borderLeft: `3px solid`,
          borderColor: 'error.main',
          pl: 2.5,
          py: 0.5,
        }}
      >
        <Typography variant="h6" sx={{ color: 'error.main', mb: 0.5 }}>
          Erreur
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.primary', mb: 0.5 }}>
          Le chargement du produit a échoué.
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Vous pouvez réessayer ou revenir à la liste.
        </Typography>
      </Box>

      {ref && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontFamily: 'monospace',
            color: 'text.disabled',
            mt: 2,
            ml: '19px',
          }}
        >
          réf\u00a0: {ref}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1, mt: 3, ml: '16px' }}>
        <Button
          variant="text"
          onClick={handleRetry}
          disabled={isPending}
          startIcon={<ReplayRoundedIcon sx={{ fontSize: '16px !important' }} />}
          size="small"
          sx={{
            color: tokens.graphite,
            '&:hover': {
              color: 'error.main',
              bgcolor: alpha('#b83c35', 0.06),
            },
          }}
        >
          {isPending ? 'Chargement…' : 'Réessayer'}
        </Button>
        <Button
          variant="text"
          onClick={() => router.push('/products')}
          startIcon={<ArrowBackRoundedIcon sx={{ fontSize: '16px !important' }} />}
          size="small"
          sx={{
            color: tokens.graphite,
            '&:hover': {
              color: tokens.charcoal,
              bgcolor: alpha(tokens.ash, 0.5),
            },
          }}
        >
          Retour
        </Button>
      </Box>
    </Box>
  )
}
