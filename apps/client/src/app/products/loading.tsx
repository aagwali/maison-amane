import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'

export default function ProductsLoading() {
  return (
    <Box sx={{ px: { xs: 3, md: 4 }, py: { xs: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header skeleton */}
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width={80} height={16} sx={{ mb: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Skeleton variant="text" width={160} height={44} />
          <Skeleton variant="rounded" width={110} height={34} />
        </Box>
      </Box>

      {/* Toolbar skeleton */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          mb: 3,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Skeleton variant="rounded" width={280} height={36} />
        <Skeleton variant="rounded" width={34} height={34} sx={{ borderRadius: 0 }} />
      </Box>

      {/* Grid skeleton */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(5, 1fr)',
            xl: 'repeat(6, 1fr)',
          },
          gap: 2,
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Box key={i}>
            <Skeleton
              variant="rounded"
              sx={{ aspectRatio: '1', width: '100%', borderRadius: 0, mb: 1.5 }}
            />
            <Skeleton variant="text" width="75%" height={20} />
            <Skeleton variant="text" width="40%" height={14} sx={{ mt: 0.5 }} />
          </Box>
        ))}
      </Box>
    </Box>
  )
}
