'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import Link from 'next/link'

import { tokens } from '@/theme/theme'

export default function NotFound() {
  return (
    <Box sx={{ p: { xs: 3, md: 5 }, maxWidth: 520 }}>
      <Typography
        sx={{
          fontFamily: 'var(--font-dm-serif)',
          fontSize: '4rem',
          lineHeight: 1,
          color: tokens.ash,
          letterSpacing: '-0.02em',
          mb: 1.5,
        }}
      >
        404
      </Typography>
      <Typography variant="h3" sx={{ mb: 0.5 }}>
        Page introuvable
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </Typography>
      <Button
        component={Link}
        href="/"
        variant="text"
        startIcon={<ArrowBackRoundedIcon />}
        size="small"
      >
        Retour à l&apos;accueil
      </Button>
    </Box>
  )
}
