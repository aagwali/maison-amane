import { runApiPage } from '@/lib/api-client'
import ProductListGrid from '@/components/product/ProductListGrid'

export default async function ProductsPage() {
  const products = await runApiPage((client) => client['pilot-product'].listAll())
  return <ProductListGrid products={products} />
}
