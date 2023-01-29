import { useState } from 'react'

import { css } from '@emotion/react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Typography,
  TextField,
  styled,
} from '@mui/material'
import Image from 'next/image'
import GoogleButton from 'react-google-button'
import { useDispatch, useSelector } from 'react-redux'

import { authChangeAction } from '../firebase/actions'
import { signIn, signInWithEmailAndPassword, signUpWithEmailAndPassword } from '../firebase/util'
import { PROJECT_TITLE } from '../shared/constants'
import { redirectTo } from '../shared/utils'
import { State } from '../state'

import { LoadingScreen } from './loading'

const OrText = styled('p')(({ theme }) => ({
  margin: 'auto',
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}))

const AlternativeSignIn = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  width: 240,
  margin: 'auto',
})

interface SignInDialogProps {
  open: boolean
  setOpen: (newValue: boolean) => void
}

const SignInDialog = (props: SignInDialogProps) => {
  const { open, setOpen } = props
  const [action, setAction] = useState('Sign in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleClose = () => {
    setOpen(false)
    setAction('Sign in')
  }
  const handleAction = async () => {
    try {
      if (action === 'Sign in') {
        await signInWithEmailAndPassword(email, password)
      } else {
        await signUpWithEmailAndPassword(email, password)
      }
    } catch (error: any) {
      setErrorMessage(error.message)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{action}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAction()
            }}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAction()
            }}
          />
          <Link
            component="button"
            variant="body2"
            onClick={() => setAction(action === 'Sign in' ? 'Sign up' : 'Sign in')}
          >
            {action === 'Sign in' ? 'or create a new account' : 'or sign in with an existing account'}
          </Link>
          {errorMessage !== '' && (
            <Typography
              color="error"
              css={css`
                margin-top: 16px;
              `}
              variant="body2"
            >
              {errorMessage}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAction} color="primary">
            {action}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const Login = () => {
  const dispatch = useDispatch()
  const signInStatus = useSelector((state: State) => state.signInStatus)
  const [open, setOpen] = useState(false)

  if (signInStatus === 'loggedIn') {
    redirectTo('/add')
    return null
  }

  switch (signInStatus) {
    case 'unknown':
      return <LoadingScreen />
    case 'loggingIn':
      return <LoadingScreen text="Signing in..." />
    case 'loggedOut':
      return (
        <>
          <Image
            width={200}
            height={200}
            src="/static/coin.svg"
            priority
            alt="coin"
            css={css`
              width: min(25vh, 50vw);
              height: min(25vh, 50vw);
              margin: auto;
              margin-top: 10vh;
              display: block;
            `}
          />

          <Typography
            variant="h4"
            gutterBottom
            css={css`
              text-align: center;
              margin-top: 5vh;
            `}
          >
            {PROJECT_TITLE}
          </Typography>

          <GoogleButton
            onClick={async () => {
              await dispatch(authChangeAction('loggingIn', null))
              signIn()
            }}
            css={css`
              margin: auto;
              margin-top: 10vh;
            `}
          />

          <AlternativeSignIn>
            <OrText>Or</OrText>
            <Button variant="contained" onClick={() => setOpen(true)}>
              Sign in using email
            </Button>
          </AlternativeSignIn>

          <SignInDialog open={open} setOpen={setOpen} />
        </>
      )
  }
}

export default Login
