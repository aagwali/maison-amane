import * as React from 'react'

import ProductDetailShell from '@/components/product/ProductDetailShell'

export default function ProductDetailLayout({ children }: { children: React.ReactNode }) {
  return <ProductDetailShell>{children}</ProductDetailShell>
}
