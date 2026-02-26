import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'

export default function ProductsLoading() {
  return (
    <Box sx={{ px: { xs: 3, md: 4 }, py: { xs: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header skeleton */}
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width={80} height={16} sx={{ mb: 1 }} />
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Skeleton variant="text" width={160} height={44} />
          <Skeleton variant="rounded" width={110} height={34} />
        </Stack>
      </Box>

      {/* Toolbar skeleton */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Skeleton variant="rounded" width={280} height={36} />
        <Skeleton variant="rounded" width={34} height={34} sx={{ borderRadius: 0 }} />
      </Stack>

      {/* Grid skeleton */}
      <Grid container spacing={2}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <Box>
              <Skeleton
                variant="rounded"
                sx={{ aspectRatio: '1', width: '100%', borderRadius: 0, mb: 1.5 }}
              />
              <Skeleton variant="text" width="75%" height={20} />
              <Skeleton variant="text" width="40%" height={14} sx={{ mt: 0.5 }} />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
