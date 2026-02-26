'use client'

import type { ReactNode } from 'react'
import Box from '@mui/material/Box'

import { ProductFormProvider, type ProductFormInitialData } from '@/contexts/ProductFormContext'

interface ProductDetailShellProps {
  initialData?: ProductFormInitialData
  children: ReactNode
}

export default function ProductDetailShell({ initialData, children }: ProductDetailShellProps) {
  return (
    <ProductFormProvider initialData={initialData}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>{children}</Box>
    </ProductFormProvider>
  )
}
