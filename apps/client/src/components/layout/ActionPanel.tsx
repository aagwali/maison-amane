'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { ACTION_PANEL_WIDTH } from './constants'

export default function ActionPanel() {
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
      <TextField label="Product Title" variant="outlined" size="small" fullWidth sx={{ mb: 2 }} />

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Options à venir
        </Typography>
      </Box>

      <Button variant="contained" color="primary" fullWidth>
        Save Product
      </Button>
    </Box>
  )
}
