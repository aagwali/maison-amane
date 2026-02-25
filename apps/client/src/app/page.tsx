'use client'

import Box from '@mui/material/Box'
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
    color: '#3d6e9a',
  },
]

export default function HomePage() {
  return (
    <Box sx={{ px: { xs: 3, md: 4 }, py: { xs: 3, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
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
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2.5,
          mb: 5,
        }}
      >
        {quickStats.map((stat) => (
          <Box
            key={stat.label}
            sx={{
              py: 2.5,
              borderTop: `2px solid`,
              borderColor: stat.color,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <stat.icon sx={{ fontSize: 18, color: stat.color }} />
              <Typography variant="h6" sx={{ textTransform: 'uppercase', color: 'text.secondary' }}>
                {stat.label}
              </Typography>
            </Box>
            <Typography
              variant="h2"
              sx={{ fontFamily: 'var(--font-dm-serif)', color: 'text.secondary', opacity: 0.4 }}
            >
              {stat.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Placeholder area */}
      <Box
        sx={{
          py: 5,
          borderTop: `1px solid`,
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Les widgets du tableau de bord apparaîtront ici.
        </Typography>
      </Box>
    </Box>
  )
}
