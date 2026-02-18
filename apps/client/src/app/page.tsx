import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

export default function HomePage() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Maison Amane
        </Typography>
        <Typography variant="h5" color="text.secondary">
          Tapis sur mesure
        </Typography>
      </Box>
    </Container>
  )
}
