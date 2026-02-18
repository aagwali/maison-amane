'use client'

import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a1a2e',
    },
    secondary: {
      main: '#e94560',
    },
  },
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
})

export default theme
