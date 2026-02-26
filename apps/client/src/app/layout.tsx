import * as React from 'react'
import type { Metadata } from 'next'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

import ThemeRegistry from '@/theme/ThemeRegistry'
import NavigationRail from '@/components/layout/Sidebar'

const dmSans = DM_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
})

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-serif',
})

export const metadata: Metadata = {
  title: 'Maison Amane',
  description: 'Tapis sur mesure — Back Office',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${dmSans.variable} ${dmSerif.variable}`}>
        <ThemeRegistry>
          <Stack direction="row" sx={{ height: '100vh', overflow: 'hidden' }}>
            <NavigationRail />
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
          </Stack>
        </ThemeRegistry>
      </body>
    </html>
  )
}
