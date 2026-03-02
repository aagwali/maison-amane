'use client'

import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

import { typeLabels, shapeLabels, materialLabels, sizeLabels } from './constants'

import {
  PRODUCT_TYPE_OPTIONS,
  SHAPE_OPTIONS,
  MATERIAL_OPTIONS,
  SIZE_OPTIONS,
  RUNNER_SIZE_OPTIONS,
} from '@/contexts/ProductFormContext'
import { tokens } from '@/theme/theme'

interface Props {
  title: string
  setTitle: (v: string) => void
  description: string
  setDescription: (v: string) => void
  productType: string
  setProductType: (v: string) => void
  shape: string
  setShape: (v: string) => void
  material: string
  setMaterial: (v: string) => void
  sizes: string[]
  setSizes: (v: string[]) => void
}

export default function ProductDetailsForm({
  title,
  setTitle,
  description,
  setDescription,
  productType,
  setProductType,
  shape,
  setShape,
  material,
  setMaterial,
  sizes,
  setSizes,
}: Props) {
  const availableSizes = shape === 'RUNNER' ? RUNNER_SIZE_OPTIONS : SIZE_OPTIONS
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
        <InputLabel>Forme</InputLabel>
        <Select value={shape} onChange={(e) => setShape(e.target.value)}>
          {SHAPE_OPTIONS.map((s) => (
            <MenuItem key={s} value={s}>
              {shapeLabels[s] ?? s}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth size="small" variant="standard" sx={{ mb: 3 }}>
        <InputLabel>Matériau</InputLabel>
        <Select value={material} onChange={(e) => setMaterial(e.target.value)}>
          {MATERIAL_OPTIONS.map((m) => (
            <MenuItem key={m} value={m}>
              {materialLabels[m] ?? m}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider sx={{ mb: 2.5, borderStyle: 'dashed', borderColor: tokens.ash }} />

      <Typography variant="h6" sx={{ mb: 2 }}>
        Variantes
      </Typography>

      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
          Tailles
        </Typography>
        <ToggleButtonGroup
          value={sizes}
          onChange={(_, next: string[]) => next.length > 0 && setSizes(next)}
          size="small"
          sx={{ flexWrap: 'wrap', gap: 0.5 }}
        >
          {availableSizes.map((s) => (
            <ToggleButton
              key={s}
              value={s}
              sx={{
                px: 2,
                py: 0.5,
                fontSize: '0.75rem',
                '&.Mui-selected': {
                  bgcolor: tokens.ember,
                  color: tokens.white,
                  borderColor: tokens.ember,
                  '&:hover': { bgcolor: tokens.emberDark },
                },
              }}
            >
              {sizeLabels[s] ?? s}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    </Box>
  )
}
