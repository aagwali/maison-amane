'use client'

import { usePathname } from 'next/navigation'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded'
import Link from 'next/link'
import { alpha } from '@mui/material/styles'

import { NAV_RAIL_WIDTH } from './constants'

import { tokens } from '@/theme/theme'

const navItems = [
  { label: 'Accueil', href: '/', icon: HomeRoundedIcon },
  { label: 'Produits', href: '/products', icon: Inventory2RoundedIcon },
]

export default function NavigationRail() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <Stack
      component="nav"
      alignItems="center"
      sx={{
        width: NAV_RAIL_WIDTH,
        flexShrink: 0,
        height: '100vh',
        bgcolor: tokens.charcoal,
        py: 2,
        gap: 1,
        position: 'relative',
        zIndex: 1200,
      }}
    >
      {/* Brand mark */}
      <Box
        component={Link}
        href="/"
        sx={{
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          textDecoration: 'none',
          opacity: 0.9,
          '&:hover': { opacity: 1 },
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 3L4 21" stroke={tokens.ember} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 3L20 21" stroke={tokens.ember} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M7 14L17 14" stroke={tokens.ember} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 2L8.5 8.5" stroke={tokens.ember} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M12 2L15.5 8.5" stroke={tokens.ember} strokeWidth="1.2" strokeLinecap="round" />
          <path
            d="M6.5 5.5L17.5 5.5"
            stroke={tokens.ember}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </Box>

      {/* Navigation items */}
      <Stack spacing={0.5} sx={{ width: '100%', px: 1 }}>
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Tooltip key={href} title={label} placement="right" arrow>
              <Box
                component={Link}
                href={href}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  py: 1,
                  px: 0.5,
                  borderRadius: 0,
                  textDecoration: 'none',
                  color: active ? tokens.white : alpha(tokens.white, 0.45),
                  bgcolor: active ? alpha(tokens.white, 0.1) : 'transparent',
                  transition: 'color 0.15s ease, background-color 0.15s ease',
                  '&:hover': {
                    color: tokens.white,
                    bgcolor: alpha(tokens.white, 0.08),
                  },
                }}
              >
                <Icon sx={{ fontSize: 22 }} />
                <Typography
                  sx={{
                    fontSize: '0.5625rem',
                    fontWeight: active ? 600 : 400,
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                  }}
                >
                  {label}
                </Typography>
              </Box>
            </Tooltip>
          )
        })}
      </Stack>
    </Stack>
  )
}
