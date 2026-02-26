'use client'

import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { typeLabels, categoryLabels, priceLabels, sizeLabels } from './constants'

import {
  PRODUCT_TYPE_OPTIONS,
  CATEGORY_OPTIONS,
  PRICE_RANGE_OPTIONS,
  SIZE_OPTIONS,
} from '@/contexts/ProductFormContext'
import { tokens } from '@/theme/theme'

interface Props {
  title: string
  setTitle: (v: string) => void
  description: string
  setDescription: (v: string) => void
  productType: string
  setProductType: (v: string) => void
  category: string
  setCategory: (v: string) => void
  priceRange: string
  setPriceRange: (v: string) => void
  size: string
  setSize: (v: string) => void
}

export default function ProductDetailsForm({
  title,
  setTitle,
  description,
  setDescription,
  productType,
  setProductType,
  category,
  setCategory,
  priceRange,
  setPriceRange,
  size,
  setSize,
}: Props) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Informations
      </Typography>

      <TextField
        label="Titre du produit"
        fullWidth
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 2.5 }}
        placeholder="ex: Tapis Atlas Royal"
      />

      <TextField
        label="Description"
        fullWidth
        multiline
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        sx={{ mb: 3 }}
        placeholder="Description du produit..."
      />

      <Divider sx={{ mb: 2.5, borderStyle: 'dashed', borderColor: tokens.ash }} />

      <Typography variant="h6" sx={{ mb: 2 }}>
        Classification
      </Typography>

      <FormControl fullWidth size="small" variant="standard" sx={{ mb: 2.5 }}>
        <InputLabel>Type</InputLabel>
        <Select value={productType} onChange={(e) => setProductType(e.target.value)}>
          {PRODUCT_TYPE_OPTIONS.map((t) => (
            <MenuItem key={t} value={t}>
              {typeLabels[t] ?? t}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth size="small" variant="standard" sx={{ mb: 2.5 }}>
        <InputLabel>Catégorie</InputLabel>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORY_OPTIONS.map((c) => (
            <MenuItem key={c} value={c}>
              {categoryLabels[c] ?? c}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth size="small" variant="standard" sx={{ mb: 3 }}>
        <InputLabel>Gamme de prix</InputLabel>
        <Select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
          {PRICE_RANGE_OPTIONS.map((p) => (
            <MenuItem key={p} value={p}>
              {priceLabels[p] ?? p}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider sx={{ mb: 2.5, borderStyle: 'dashed', borderColor: tokens.ash }} />

      <Typography variant="h6" sx={{ mb: 2 }}>
        Variantes
      </Typography>

      <FormControl fullWidth size="small" variant="standard">
        <InputLabel>Taille</InputLabel>
        <Select value={size} onChange={(e) => setSize(e.target.value)}>
          {SIZE_OPTIONS.map((s) => (
            <MenuItem key={s} value={s}>
              {sizeLabels[s] ?? s}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )
}
