import * as React from 'react'
import Box from '@mui/material/Box'

import ActionPanel from '@/components/layout/ActionPanel'

export default function ProductDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>{children}</Box>
      <ActionPanel />
    </Box>
  )
}
