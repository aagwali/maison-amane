'use client'

import Link from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import type { PilotProductResponse } from '@maison-amane/api'

interface Props {
  products: readonly PilotProductResponse[]
}

export default function ProductListGrid({ products }: Props) {
  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Products
        </Typography>
        <Button component={Link} href="/products/new" variant="contained" startIcon={<AddIcon />}>
          New Product
        </Button>
      </Box>

      {products.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Aucun produit
          </Typography>
          <Button component={Link} href="/products/new" variant="outlined" startIcon={<AddIcon />}>
            Créer un produit
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {products.map((p) => (
            <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardActionArea component={Link} href={`/products/${p.id}`}>
                  <CardMedia
                    component="img"
                    image={p.views.front.imageUrl}
                    height={200}
                    alt={p.label}
                  />
                  <CardContent>
                    <Typography variant="subtitle1" noWrap>
                      {p.label}
                    </Typography>
                    <Chip label={p.status} size="small" sx={{ mt: 1 }} />
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
