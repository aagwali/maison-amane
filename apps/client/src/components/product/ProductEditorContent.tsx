import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import type { PilotProductResponse } from '@maison-amane/api'

interface ProductEditorContentProps {
  product?: PilotProductResponse
}

export default function ProductEditorContent({ product: _ }: ProductEditorContentProps) {
  return (
    <Box>
      {/* Upload zone */}
      <Box
        sx={{
          border: '2px dashed',
          borderColor: 'secondary.main',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          mb: 4,
          bgcolor: 'background.paper',
          color: 'text.secondary',
          gap: 1,
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: 'secondary.main' }} />
        <Typography variant="h6" color="text.primary">
          Drag &amp; Drop Upload Zone
        </Typography>
        <Typography variant="body2">Luxury handmade rug e-commerce site</Typography>
      </Box>

      {/* Gallery */}
      <Typography variant="h6" gutterBottom>
        Gallery
      </Typography>
      <Grid container spacing={1.5}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid key={i} size={{ xs: 6, sm: 4, md: 3 }}>
            <Box
              sx={{
                aspectRatio: '4 / 3',
                bgcolor: 'secondary.main',
                opacity: 0.2,
                borderRadius: 1,
              }}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
