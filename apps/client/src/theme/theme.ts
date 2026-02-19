'use client'

import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#5C5248',
    },
    secondary: {
      main: '#B8A590',
    },
    background: {
      default: '#FAF8F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#3A3530',
      secondary: '#7A7068',
    },
  },
  typography: {
    fontFamily: 'var(--font-roboto)',
  },
})

export default theme
