import * as React from 'react'
import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'

import ThemeRegistry from '@/theme/ThemeRegistry'

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
})

export const metadata: Metadata = {
  title: 'Maison Amane',
  description: 'Tapis sur mesure — Back Office',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={roboto.variable}>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  )
}
