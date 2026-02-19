import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export default function ProductsPage() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Products
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Liste produits à venir
      </Typography>
    </Box>
  )
}
