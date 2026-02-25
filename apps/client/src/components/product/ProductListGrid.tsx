'use client'

import Link from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import type { PilotProductResponse } from '@maison-amane/api'

import { tokens } from '@/theme/theme'

interface Props {
  products: readonly PilotProductResponse[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PUBLISHED: { label: 'Publié', color: '#4a7a40' },
  DRAFT: { label: 'Brouillon', color: '#8b8635' },
  ARCHIVED: { label: 'Archivé', color: '#8a8a8a' },
}

function getStatusProps(status: string) {
  return statusConfig[status] ?? { label: status, color: tokens.pewter }
}

export default function ProductListGrid({ products }: Props) {
  return (
    <Box sx={{ px: { xs: 3, md: 4 }, py: { xs: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" sx={{ mb: 0.5, display: 'block' }}>
          Catalogue
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
            <Typography variant="h1">Produits</Typography>
            <Typography variant="body2" color="text.secondary">
              {products.length} {products.length <= 1 ? 'élément' : 'éléments'}
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/products/new"
            variant="contained"
            startIcon={<AddRoundedIcon />}
            size="small"
          >
            Nouveau
          </Button>
        </Box>
      </Box>

      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 3,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <TextField
          placeholder="Rechercher..."
          size="small"
          disabled
          sx={{ width: 280 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Tooltip title="Filtres (bientôt)">
          <span>
            <IconButton size="small" disabled>
              <FilterListRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Grid */}
      {products.length === 0 ? (
        <Box sx={{ py: 10, px: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Aucun produit pour le moment.
          </Typography>
          <Button
            component={Link}
            href="/products/new"
            variant="contained"
            startIcon={<AddRoundedIcon />}
          >
            Créer un produit
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(5, 1fr)',
              xl: 'repeat(6, 1fr)',
            },
            gap: 2,
          }}
        >
          {products.map((p) => {
            const status = getStatusProps(p.status)
            return (
              <Box
                key={p.id}
                component={Link}
                href={`/products/${p.id}`}
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                  pb: 2,
                  borderBottom: `1px solid`,
                  borderColor: tokens.ash,
                  transition: 'border-color 0.15s ease',
                  '&:hover': {
                    borderColor: tokens.ember,
                  },
                  '&:hover .product-img': {
                    opacity: 0.88,
                  },
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    aspectRatio: '1',
                    bgcolor: tokens.fog,
                    overflow: 'hidden',
                    mb: 1.5,
                  }}
                >
                  <Box
                    className="product-img"
                    component="img"
                    src={p.views.front.imageUrl}
                    alt={p.label}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'opacity 0.2s ease',
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 1,
                  }}
                >
                  <Typography variant="subtitle1" noWrap sx={{ lineHeight: 1.3, flex: 1 }}>
                    {p.label}
                  </Typography>
                  <Chip
                    label={status.label}
                    size="small"
                    sx={{
                      bgcolor: 'transparent',
                      color: status.color,
                      fontWeight: 600,
                      fontSize: '0.625rem',
                      height: 18,
                      letterSpacing: '0.04em',
                      flexShrink: 0,
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.disabled">
                  {p.id.slice(0, 8)}
                </Typography>
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
