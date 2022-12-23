import { ComponentType, Fragment } from 'react'

import { css } from '@emotion/react'
import ProfileIcon from '@mui/icons-material/AccountCircle'
import AddIcon from '@mui/icons-material/Add'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import BarChartIcon from '@mui/icons-material/BarChart'
import CodeIcon from '@mui/icons-material/Code'
import OverviewIcon from '@mui/icons-material/Home'
import ListIcon from '@mui/icons-material/List'
import TagIcon from '@mui/icons-material/Style'
import TimelineIcon from '@mui/icons-material/Timeline'
import {
  useTheme,
  BottomNavigation,
  BottomNavigationAction,
  Collapse,
  Divider,
  Drawer,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  SvgIconProps,
  Typography,
} from '@mui/material'
import Image from 'next/image'
import { useDispatch, useSelector } from 'react-redux'
import { makeStyles } from 'tss-react/mui'

import { setCurrentScreen } from '../actions'
import { changeNavigationExpanded } from '../shared/actions'
import { useIsBigDevice, useIsVeryBigDevice } from '../shared/hooks'
import { redirectTo } from '../shared/utils'
import { ScreenTitle, State } from '../state'

export const DRAWER_WIDTH = 260

const useStyles = makeStyles()({
  bottomNav: {
    // hide bottom navigation when keyboard is up
    ['@media (max-height:500px)']: {
      display: 'none',
    },
    width: '100%',
    position: 'fixed',
    bottom: 0,
  },
  drawer: {
    width: DRAWER_WIDTH,
    flexShrink: 0,
  },
  drawerPaper: {
    overflow: 'hidden',
    width: DRAWER_WIDTH,
    borderRight: '2px solid grey',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
  },
  listItemText: {
    padding: '8px 16px',
  },
  listItemTextActive: {
    color: '#a5790a',
    fontWeight: 600,
  },
  listItemIconActive: {
    transform: 'scale(1.1)',
    transition: 'all .2s ease-in-out',
  },
})

interface NavigationItem {
  screen: ScreenTitle
  Icon: ComponentType<SvgIconProps>
  hideOnSmallDevice?: true
  noRedirect?: true
  sublist?: NavigationItem[]
}

const navigationItems: NavigationItem[] = [
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
  { screen: 'profile', Icon: ProfileIcon },
]

interface ListItemProps {
  item: NavigationItem
  currentScreen: ScreenTitle
  nested?: true
}

const ListItemComponent = ({ item, currentScreen, nested }: ListItemProps) => {
  const { screen, sublist, Icon, noRedirect } = item
  const isActive = currentScreen == screen
  const itemsExpanded = useSelector((state: State) => state.navigation.expanded)
  const theme = useTheme()

  const dispatch = useDispatch()
  const { classes, cx } = useStyles()

  return (
    <Fragment>
      <ListItemButton
        onClick={() => {
          if (sublist) {
            dispatch(
              changeNavigationExpanded({
                ...itemsExpanded,
                [screen]: currentScreen === screen ? !itemsExpanded[screen] : true,
              })
            )
          }
          dispatch(setCurrentScreen(screen))

          if (!noRedirect) {
            redirectTo(`/${screen}`)
          }
        }}
        css={css`
          text-transform: capitalize;
          padding: unset;
          // TODO: This is very hacky, make it better
          ${nested ? `padding-left: ${theme.spacing(4)};` : ''}
          background-color: ${isActive ? 'rgba(0,0,0,0.1)' : 'unset'};
        `}
      >
        <ListItemText
          primary={screen.split('/').reverse()[0]}
          classes={{
            root: classes.listItemText,
            primary: cx(isActive && classes.listItemTextActive),
          }}
        />
        <ListItemIcon
          css={css`
            min-width: 45px;
          `}
          className={cx(isActive && classes.listItemIconActive)}
        >
          <Icon color={isActive ? 'primary' : 'inherit'} />
        </ListItemIcon>
      </ListItemButton>
      <Divider />

      <Collapse in={itemsExpanded[screen]} unmountOnExit>
        {sublist?.map((item) => (
          <ListItemComponent item={item} currentScreen={currentScreen} key={item.screen} nested={true} />
        ))}
      </Collapse>
    </Fragment>
  )
}

const Navigation = () => {
  const currentScreen = useSelector((state: State) => state.currentScreen)
  const dispatch = useDispatch()
  const { classes } = useStyles()

  const bigDevice = useIsBigDevice()
  const veryBigDevice = useIsVeryBigDevice()

  if (veryBigDevice) {
    return (
      <Drawer
        variant="permanent"
        className={classes.drawer}
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <Typography
          variant="h5"
          css={css`
            padding: 24px 0;
            display: flex;
            font-weight: 600;
            // TODO: Use colors from theme
            background: linear-gradient(
              45deg,
              rgba(165, 121, 10, 0.7049370773700105) 0%,
              rgba(255, 235, 205, 1) 50%,
              rgba(165, 121, 10, 0.7049370773700105) 100%
            );
          `}
          color="primary"
        >
          <Image
            width={35}
            height={35}
            src="/static/coin.svg"
            alt="coin"
            css={css`
              width: 35px;
              margin: 0 8px;
            `}
          />
          Expense manager
        </Typography>
        <Divider />

        <div>
          {navigationItems
            .filter((item) => (bigDevice ? true : !item.hideOnSmallDevice))
            .map((item) => (
              <ListItemComponent item={item} currentScreen={currentScreen} key={item.screen} />
            ))}
        </div>
      </Drawer>
    )
  }

  return (
    <BottomNavigation value={currentScreen} showLabels css={classes.bottomNav}>
      {navigationItems
        .filter((item) => (bigDevice ? true : !item.hideOnSmallDevice))
        .map(({ screen, Icon }) => (
          // NOTE: BottomNavigationAction must be a direct child of BottomNavigation
          <BottomNavigationAction
            onClick={() => {
              redirectTo(`/${screen}`)
              dispatch(setCurrentScreen(screen))
            }}
            label={screen}
            value={screen}
            icon={<Icon />}
            css={css`
              text-transform: capitalize;
              min-width: unset;
              padding: unset;
            `}
            key={screen}
          />
        ))}
    </BottomNavigation>
  )
}

export default Navigation
