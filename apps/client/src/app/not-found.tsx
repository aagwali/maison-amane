'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Link from 'next/link'

export default function NotFound() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 2,
        color: 'text.secondary',
      }}
    >
      <Typography variant="h4" color="text.primary">
        404
      </Typography>
      <Typography variant="body1">Cette page n&apos;existe pas.</Typography>
      <Button component={Link} href="/" variant="outlined" size="small">
        Retour à l&apos;accueil
      </Button>
    </Box>
  )
}
