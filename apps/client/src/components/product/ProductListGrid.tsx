'use client'

import Link from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import type { PilotProductResponse } from '@maison-amane/api'

import ProductCard from './ProductCard'

interface Props {
  products: readonly PilotProductResponse[]
}

export default function ProductListGrid({ products }: Props) {
  return (
    <Box sx={{ px: { xs: 3, md: 4 }, py: { xs: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" sx={{ mb: 0.5, display: 'block' }}>
          Catalogue
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="baseline" spacing={1.5}>
            <Typography variant="h1">Produits</Typography>
            <Typography variant="body2" color="text.secondary">
              {products.length} {products.length <= 1 ? 'élément' : 'éléments'}
            </Typography>
          </Stack>
          <Button
            component={Link}
            href="/products/new"
            variant="contained"
            startIcon={<AddRoundedIcon />}
            size="small"
          >
            Nouveau
          </Button>
        </Stack>
      </Box>

      {/* Toolbar */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
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
      </Stack>

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
        <Grid container spacing={2}>
          {products.map((p) => (
            <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <ProductCard product={p} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
