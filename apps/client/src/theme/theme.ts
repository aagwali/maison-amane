'use client'

import { createTheme, alpha } from '@mui/material/styles'

const tokens = {
  // Primary — orange brûlé
  ember: '#d06224',
  emberLight: '#dc7b44',
  emberDark: '#b55120',

  // Secondary — olive dorée
  olive: '#8b8635',
  oliveLight: '#a29f3d',
  oliveDark: '#6d6929',

  // White
  white: '#FFFFFF',

  // Steel (Commandes)
  steel: '#3d6e9a',

  // Neutral — gamme gris charbon
  charcoal: '#333333', // sidebar, texte intense
  charcoalLight: '#454545', // hover sidebar
  graphite: '#5e5e5e', // texte secondaire fort
  pewter: '#8a8a8a', // ton neutre médian
  silver: '#b8b8b8', // border médiane
  ash: '#d6d3cf', // border légère (légèrement chaude)
  fog: '#eceae6', // background neutre doux
  mist: '#f4f2ef', // background page
  pearl: '#fdfcfa', // background paper
}

const theme = createTheme({
  palette: {
    primary: {
      main: tokens.ember,
      light: tokens.emberLight,
      dark: tokens.emberDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: tokens.olive,
      light: tokens.oliveLight,
      dark: tokens.oliveDark,
      contrastText: '#FFFFFF',
    },
    background: {
      default: tokens.mist,
      paper: tokens.pearl,
    },
    text: {
      primary: tokens.charcoal,
      secondary: tokens.graphite,
      disabled: tokens.silver,
    },
    divider: tokens.ash,
    error: { main: '#b83c35' },
    warning: { main: tokens.olive },
    success: { main: '#4a7a40' },
    info: { main: '#3d6e9a' },
  },

  typography: {
    fontFamily: 'var(--font-dm-sans)',

    h1: {
      fontFamily: 'var(--font-dm-serif)',
      fontWeight: 400,
      fontSize: '2.25rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontFamily: 'var(--font-dm-serif)',
      fontWeight: 400,
      fontSize: '1.75rem',
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: 'var(--font-dm-serif)',
      fontWeight: 400,
      fontSize: '1.375rem',
      lineHeight: 1.3,
    },
    h4: {
      fontFamily: 'var(--font-dm-serif)',
      fontWeight: 400,
      fontSize: '1.125rem',
      lineHeight: 1.35,
    },
    h5: {
      fontFamily: 'var(--font-dm-sans)',
      fontWeight: 600,
      fontSize: '0.9375rem',
      lineHeight: 1.4,
      letterSpacing: '0.01em',
    },
    h6: {
      fontFamily: 'var(--font-dm-sans)',
      fontWeight: 600,
      fontSize: '0.8125rem',
      lineHeight: 1.5,
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '0.9375rem',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.8125rem',
      lineHeight: 1.5,
      color: tokens.graphite,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.6875rem',
      lineHeight: 1.5,
      letterSpacing: '0.03em',
      color: tokens.pewter,
    },
    button: {
      fontWeight: 600,
      fontSize: '0.8125rem',
      letterSpacing: '0.02em',
    },
    overline: {
      fontSize: '0.6875rem',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: tokens.pewter,
    },
  },

  shape: { borderRadius: 0 },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: tokens.mist,
        },
        '*::-webkit-scrollbar': {
          width: 5,
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          background: tokens.ash,
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: tokens.silver,
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
        elevation1: {
          boxShadow: 'none',
          border: `1px solid ${tokens.ash}`,
        },
        elevation2: {
          boxShadow: 'none',
          border: `1px solid ${tokens.ash}`,
        },
        elevation3: {
          boxShadow: 'none',
          border: `1px solid ${tokens.ash}`,
        },
        elevation4: {
          boxShadow: 'none',
          border: `1px solid ${tokens.ash}`,
        },
        elevation8: {
          boxShadow: 'none',
          border: `1px solid ${tokens.ash}`,
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 0,
          padding: '8px 20px',
          transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease',
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: tokens.emberDark,
          },
        },
        outlined: {
          borderColor: tokens.ash,
          color: tokens.charcoal,
          '&:hover': {
            borderColor: tokens.ember,
            backgroundColor: alpha(tokens.ember, 0.04),
          },
        },
        text: {
          color: tokens.graphite,
          '&:hover': {
            backgroundColor: alpha(tokens.ember, 0.06),
            color: tokens.ember,
          },
        },
        sizeSmall: {
          padding: '5px 14px',
          fontSize: '0.75rem',
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          transition: 'all 0.15s ease',
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: `1px solid ${tokens.ash}`,
          borderRadius: 0,
          overflow: 'hidden',
          transition: 'border-color 0.15s ease',
          '&:hover': {
            borderColor: tokens.silver,
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontWeight: 500,
          height: 22,
          fontSize: '0.6875rem',
          letterSpacing: '0.04em',
        },
        filled: {
          border: 'none',
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            backgroundColor: tokens.pearl,
            '& fieldset': {
              borderColor: tokens.ash,
              transition: 'border-color 0.15s ease',
            },
            '&:hover fieldset': {
              borderColor: tokens.silver,
            },
            '&.Mui-focused fieldset': {
              borderColor: tokens.ember,
              borderWidth: 1.5,
            },
          },
          '& .MuiInputLabel-root': {
            color: tokens.pewter,
            fontSize: '0.8125rem',
            '&.Mui-focused': {
              color: tokens.ember,
            },
          },
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },

    // Standard Input (variant="standard") — utilisé pour les selects d'enum
    MuiInput: {
      styleOverrides: {
        root: {
          '&:before': {
            borderBottomColor: tokens.ash,
          },
          '&:hover:not(.Mui-disabled):before': {
            borderBottomColor: tokens.silver,
            borderBottomWidth: 1,
          },
          '&:after': {
            borderBottomColor: tokens.ember,
          },
        },
      },
    },

    // InputLabel pour variant="standard"
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: tokens.pewter,
          fontSize: '0.8125rem',
          '&.Mui-focused': {
            color: tokens.ember,
          },
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          boxShadow: 'none',
          border: `1px solid ${tokens.ash}`,
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          '&:hover': {
            backgroundColor: alpha(tokens.ember, 0.05),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(tokens.ember, 0.08),
            fontWeight: 500,
            '&:hover': {
              backgroundColor: alpha(tokens.ember, 0.12),
            },
          },
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: '1px solid',
          fontSize: '0.8125rem',
        },
        standardError: {
          borderColor: alpha('#b83c35', 0.2),
          backgroundColor: alpha('#b83c35', 0.06),
        },
        standardSuccess: {
          borderColor: alpha('#4a7a40', 0.2),
          backgroundColor: alpha('#4a7a40', 0.06),
        },
        standardWarning: {
          borderColor: alpha(tokens.olive, 0.25),
          backgroundColor: alpha(tokens.olive, 0.06),
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: tokens.charcoal,
          fontSize: '0.75rem',
          borderRadius: 0,
          padding: '6px 12px',
        },
        arrow: {
          color: tokens.charcoal,
        },
      },
    },

    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.fog,
          borderRadius: 0,
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: tokens.ash,
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: tokens.fog,
          height: 3,
        },
        bar: {
          borderRadius: 0,
        },
      },
    },
  },
})

export { tokens }
export default theme
