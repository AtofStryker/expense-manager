import { ComponentType } from 'react'

import ProfileIcon from '@mui/icons-material/AccountCircle'
import AddIcon from '@mui/icons-material/Add'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import BarChartIcon from '@mui/icons-material/BarChart'
import CodeIcon from '@mui/icons-material/Code'
import SignOutIcon from '@mui/icons-material/ExitToApp'
import OverviewIcon from '@mui/icons-material/Home'
import ListIcon from '@mui/icons-material/List'
import TagIcon from '@mui/icons-material/Style'
import TimelineIcon from '@mui/icons-material/Timeline'
import { SvgIconProps } from '@mui/material'
import { getAuth } from 'firebase/auth'

import { ScreenTitle } from '../../state'

export interface NavigationItem {
  screen: ScreenTitle
  Icon: ComponentType<SvgIconProps>
  hideOnSmallDevice?: true
  noRedirect?: true
  sublist?: NavigationItem[]
}

export const navigationItems: NavigationItem[] = [
  { screen: 'add', Icon: AddCircleOutlineIcon },
  { screen: 'overview', Icon: OverviewIcon },
  { screen: 'transactions', Icon: ListIcon, hideOnSmallDevice: true },
  { screen: 'assets', Icon: TimelineIcon, hideOnSmallDevice: true },
  { screen: 'charts', Icon: BarChartIcon, hideOnSmallDevice: true },
  { screen: 'tags', Icon: TagIcon },
  {
    screen: 'filters',
    Icon: CodeIcon,
    hideOnSmallDevice: true,
    sublist: [{ screen: 'filters/create', Icon: AddIcon }],
  },
]

export type ProfileItemTitle = 'profile' | 'sign out'

export interface ProfileItem {
  text: ProfileItemTitle
  Icon: ComponentType<SvgIconProps>
  // If actions is not passed, default behaviour is to redirect to "/{text}" page.
  action?: () => void
}

export const profileItems: ProfileItem[] = [
  { text: 'profile', Icon: ProfileIcon },
  {
    text: 'sign out',
    Icon: SignOutIcon,
    action: () => getAuth().signOut(),
  },
]
