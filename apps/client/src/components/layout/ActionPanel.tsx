'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { ACTION_PANEL_WIDTH } from './constants'

import { useProductForm } from '@/contexts/ProductFormContext'

export default function ActionPanel() {
  const { title, setTitle, canSave, isSaving, saveError, saveProduct, uploadedImages } =
    useProductForm()

  const needsMoreImages = uploadedImages.length < 2

  return (
    <Box
      sx={{
        width: ACTION_PANEL_WIDTH,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        borderLeft: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        px: 2.5,
        py: 2,
      }}
    >
      <TextField
        label="Product Title"
        variant="outlined"
        size="small"
        fullWidth
        sx={{ mb: 2 }}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {needsMoreImages
            ? `${uploadedImages.length}/2 images minimum requises`
            : 'Options à venir'}
        </Typography>
      </Box>

      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {saveError}
        </Alert>
      )}

      <Button
        variant="contained"
        color="primary"
        fullWidth
        disabled={!canSave}
        onClick={saveProduct}
        startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : undefined}
      >
        {isSaving ? 'Saving...' : 'Save Product'}
      </Button>
    </Box>
  )
}
