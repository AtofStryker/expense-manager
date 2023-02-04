import { Alert, Grid, Snackbar, Theme } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles } from 'tss-react/mui'

import Navigation from '../components/navigation'
import { setSnackbarNotification } from '../shared/actions'
import { snackbarNotificationSel, signInStatusSel } from '../shared/selectors'
import { redirectTo } from '../shared/utils'

import ConfirmDialog from './confirmDialog'
import { LoadingOverlay } from './loading'

const useStyles = makeStyles()((theme: Theme) => ({
  root: {
    padding: theme.spacing(2),
    overflow: 'auto',
    overflowX: 'hidden',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    flexDirection: 'column',
    maxWidth: 1024,
    margin: '0 auto',
    // We set explicit height here because so child components have fixed height to render. This is important especially
    // for virtualized lists.
    height: 'calc(100vh - 64px)',
    [theme.breakpoints.down('sm')]: {
      height: 'calc(100vh - 48px)',
    },
  },
}))

interface PageWrapperProps {
  children: React.ReactNode
}

const PageWrapper = ({ children }: PageWrapperProps) => {
  const { classes, cx } = useStyles()
  const notification = useSelector(snackbarNotificationSel)
  const signInStatus = useSelector(signInStatusSel)
  const dispatch = useDispatch()

  return (
    <>
      <Navigation />
      <Grid container className={cx(classes.root)}>
        {children}
        {notification && (
          <Snackbar
            autoHideDuration={3000} // hide after max 3s
            open={!!notification}
            onClose={(_, reason) => dispatch(setSnackbarNotification(null, reason))}
            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
          >
            <Alert
              onClose={() => dispatch(setSnackbarNotification(null))}
              severity={notification.severity}
              variant="filled"
            >
              {notification.message}
            </Alert>
          </Snackbar>
        )}
      </Grid>
      {signInStatus === 'loggedOut' && (
        <ConfirmDialog
          onConfirm={() => redirectTo('/login')}
          title="Please sign in"
          open={true}
          ContentComponent={'You appear to be logged out. Redirect to login page?'}
        />
      )}
      {(signInStatus === 'loggingIn' || signInStatus === 'unknown') && <LoadingOverlay />}
    </>
  )
}

export default PageWrapper
