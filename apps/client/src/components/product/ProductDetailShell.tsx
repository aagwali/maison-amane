'use client'

import type { ReactNode } from 'react'
import Box from '@mui/material/Box'

import ActionPanel from '@/components/layout/ActionPanel'
import { ProductFormProvider, type ProductFormInitialData } from '@/contexts/ProductFormContext'

interface ProductDetailShellProps {
  initialData?: ProductFormInitialData
  children: ReactNode
}

export default function ProductDetailShell({ initialData, children }: ProductDetailShellProps) {
  return (
    <ProductFormProvider initialData={initialData}>
      <Box sx={{ display: 'flex', height: '100%' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>{children}</Box>
        <ActionPanel />
      </Box>
    </ProductFormProvider>
  )
}
