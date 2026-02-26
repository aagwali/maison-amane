'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded'
import ImageRoundedIcon from '@mui/icons-material/ImageRounded'
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded'

import { tokens } from '@/theme/theme'

const quickStats = [
  {
    label: 'Produits',
    value: '—',
    icon: Inventory2RoundedIcon,
    color: tokens.ember,
    href: '/products',
  },
  {
    label: 'Médias',
    value: '—',
    icon: ImageRoundedIcon,
    color: tokens.olive,
  },
  {
    label: 'Commandes',
    value: '—',
    icon: LocalShippingRoundedIcon,
    color: tokens.steel,
  },
]

export default function HomePage() {
  return (
    <Container maxWidth="md" sx={{ px: { xs: 3, md: 4 }, py: { xs: 3, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="overline" sx={{ mb: 0.5, display: 'block' }}>
          Tableau de bord
        </Typography>
        <Typography variant="h1" sx={{ mb: 1 }}>
          Maison Amane
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gérez vos produits, médias et commandes depuis un seul endroit.
        </Typography>
      </Box>

      {/* Quick stats */}
      <Grid container spacing={2.5} sx={{ mb: 5 }}>
        {quickStats.map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 4 }}>
            <Box
              sx={{
                py: 2.5,
                borderTop: '2px solid',
                borderColor: stat.color,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <stat.icon sx={{ fontSize: 18, color: stat.color }} />
                <Typography
                  variant="h6"
                  sx={{ textTransform: 'uppercase', color: 'text.secondary' }}
                >
                  {stat.label}
                </Typography>
              </Stack>
              <Typography
                variant="h2"
                sx={{ fontFamily: 'var(--font-dm-serif)', color: 'text.secondary', opacity: 0.4 }}
              >
                {stat.value}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Placeholder area */}
      <Box
        sx={{
          py: 5,
          borderTop: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Les widgets du tableau de bord apparaîtront ici.
        </Typography>
      </Box>
    </Container>
  )
}
