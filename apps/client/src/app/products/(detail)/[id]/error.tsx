'use client'

import { useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

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
      ref
        ? `Impossible de charger le produit. Référence : ${ref}`
        : "Impossible de charger le produit. Une erreur serveur s'est produite.",
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
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" color="error.main">
        Chargement échoué
      </Typography>
      <Typography color="text.secondary">
        Une erreur s'est produite lors du chargement du produit. Vous pouvez réessayer ou revenir à
        la liste.
      </Typography>
      {ref && (
        <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
          Référence : {ref}
        </Typography>
      )}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="contained" onClick={handleRetry} disabled={isPending}>
          {isPending ? 'Chargement...' : 'Réessayer'}
        </Button>
        <Button variant="outlined" onClick={() => router.push('/products')}>
          Retour à la liste
        </Button>
      </Box>
    </Box>
  )
}
