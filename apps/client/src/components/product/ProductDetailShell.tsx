'use client'

import type { ReactNode } from 'react'
import Box from '@mui/material/Box'

import ActionPanel from '@/components/layout/ActionPanel'
import { ProductFormProvider } from '@/contexts/ProductFormContext'

export default function ProductDetailShell({ children }: { children: ReactNode }) {
  return (
    <ProductFormProvider>
      <Box sx={{ display: 'flex', height: '100%' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>{children}</Box>
        <ActionPanel />
      </Box>
    </ProductFormProvider>
  )
}
