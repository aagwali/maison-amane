'use client'

import Link from 'next/link'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import type { PilotProductResponse } from '@maison-amane/api'

import { getStatusProps } from './constants'

import { tokens } from '@/theme/theme'

interface Props {
  product: PilotProductResponse
}

export default function ProductCard({ product }: Props) {
  const status = getStatusProps(product.status)

  return (
    <Box
      component={Link}
      href={`/products/${product.id}`}
      sx={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        pb: 2,
        borderBottom: '1px solid',
        borderColor: tokens.ash,
        transition: 'border-color 0.15s ease',
        '&:hover': { borderColor: tokens.ember },
        '&:hover .product-img': { opacity: 0.88 },
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
          src={product.views.front.imageUrl}
          alt={product.label}
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
          {product.label}
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
        {product.id.slice(0, 8)}
      </Typography>
    </Box>
  )
}
