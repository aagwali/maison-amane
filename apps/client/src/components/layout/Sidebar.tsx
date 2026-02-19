'use client'

import * as React from 'react'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Tooltip from '@mui/material/Tooltip'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import HomeIcon from '@mui/icons-material/Home'
import InventoryIcon from '@mui/icons-material/Inventory'
import Link from 'next/link'

import { SIDEBAR_WIDTH_CLOSED, SIDEBAR_WIDTH_OPEN } from './constants'

const navItems = [
  { label: 'Home', href: '/', icon: <HomeIcon /> },
  { label: 'Products', href: '/products', icon: <InventoryIcon /> },
]

export default function Sidebar() {
  const [open, setOpen] = React.useState(true)

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED,
          overflowX: 'hidden',
          transition: 'width 0.25s ease',
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'flex-end' : 'center',
          px: 1,
          py: 1.5,
          minHeight: 56,
        }}
      >
        <Tooltip title={open ? 'Réduire' : 'Agrandir'} placement="right">
          <IconButton onClick={() => setOpen(!open)} size="small">
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      <List dense sx={{ pt: 1 }}>
        {navItems.map(({ label, href, icon }) => (
          <Tooltip key={href} title={open ? '' : label} placement="right">
            <ListItemButton component={Link} href={href} sx={{ px: 2, py: 1.25 }}>
              <ListItemIcon sx={{ minWidth: open ? 40 : 'unset' }}>{icon}</ListItemIcon>
              {open && <ListItemText primary={label} />}
            </ListItemButton>
          </Tooltip>
        ))}
      </List>
    </Drawer>
  )
}
