import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Skeleton from '@mui/material/Skeleton'

export default function ProductsLoading() {
  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Skeleton variant="text" width={120} height={48} />
        <Skeleton variant="rounded" width={150} height={36} />
      </Box>

      <Grid container spacing={3}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
            <Skeleton variant="rounded" height={200} />
            <Box sx={{ mt: 1 }}>
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="rounded" width={60} height={20} sx={{ mt: 0.5 }} />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
