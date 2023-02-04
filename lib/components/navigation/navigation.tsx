import { MouseEvent, useState } from 'react'

import MenuIcon from '@mui/icons-material/Menu'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'

import { redirectTo } from '../../shared/utils'

import { NavigationItem, navigationItems, ProfileItem, profileItems } from './content'
import ExpenseManagerLogo from './logo'

function Navigation() {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null)
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null)

  const onOpenNavMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget)
  }
  const onOpenUserMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget)
  }
  const onCloseNavMenu = () => {
    setAnchorElNav(null)
  }
  const onCloseUserMenu = () => {
    setAnchorElUser(null)
  }
  const getOnNavigationItemClick = (nav: NavigationItem) => () => {
    redirectTo(`/${nav.screen}`)
  }
  const getOnProfileItemClick = (profile: ProfileItem) => () => {
    if (profile.action) return profile.action()
    redirectTo(`/${profile.text}`)
  }

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <ExpenseManagerLogo />
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={onOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={onCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {navigationItems.map((page) => (
                <MenuItem key={page.screen} onClick={getOnNavigationItemClick(page)}>
                  <page.Icon sx={{ mr: 2 }} color={'primary'} />
                  <Typography textAlign="center" textTransform="capitalize">
                    {page.screen}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {navigationItems.map((page) => (
              <Button
                key={page.screen}
                onClick={getOnNavigationItemClick(page)}
                sx={{
                  my: 1,
                  ml: 1,
                  color: 'white !important',
                  display: 'block',
                  ':hover': { backgroundColor: 'rgba(0,0,0,0.1)' },
                }}
              >
                {page.screen}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            {/* We call it "settings" because one of the items is called "profile" */}
            <Tooltip title="Open settings">
              <IconButton onClick={onOpenUserMenu} sx={{ p: 0 }}>
                {/* TODO: allow specifying avatar, load default from logged in account */}
                <Avatar alt="account avatar" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={onCloseUserMenu}
            >
              {profileItems.map((item) => (
                <MenuItem key={item.text} onClick={getOnProfileItemClick(item)}>
                  <item.Icon sx={{ mr: 2 }} color={'primary'} />
                  <Typography textAlign="center" textTransform="capitalize">
                    {item.text}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default Navigation
