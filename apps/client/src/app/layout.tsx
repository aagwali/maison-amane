import * as React from 'react'
import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import Box from '@mui/material/Box'

import ThemeRegistry from '@/theme/ThemeRegistry'
import Sidebar from '@/components/layout/Sidebar'

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
        <ThemeRegistry>
          <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <Box
              component="main"
              sx={{
                flex: 1,
                overflow: 'auto',
                bgcolor: 'background.default',
              }}
            >
              {children}
            </Box>
          </Box>
        </ThemeRegistry>
      </body>
    </html>
  )
}
