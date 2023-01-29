import { ThemeProvider } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { FirebaseApp } from 'firebase/app'
import firebasemock from 'firebase-mock'
import { Provider as ReduxProvider } from 'react-redux'
import { Store, applyMiddleware, createStore } from 'redux'
import thunk from 'redux-thunk'

import rootReducer from './redux/rootReducer'
import { State, getInitialState } from './state'
import theme from './theme'

export const reduxify = (Component: React.FC, store: Store) => {
  return (
    <ReduxProvider store={store}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Component />
        </LocalizationProvider>
      </ThemeProvider>
    </ReduxProvider>
  )
}
export const configureTestStore = (state: Partial<State> = getInitialState()) => {
  const logger = { log: () => null }
  const thunkExtra = {
    logger,
  }
  const middlewares = [thunk.withExtraArgument(thunkExtra)]
  // TODO: Migrate to redux-toolkit or avoid global store at all
  // eslint-disable-next-line deprecation/deprecation
  const store = createStore<State, any, unknown, unknown>(
    rootReducer as any,
    state as any,
    applyMiddleware(...middlewares)
  )

  return store
}

export const byAriaLabel = (value: string) => `[aria-label="${value}"]`

type ExtendedGlobal = typeof globalThis & { mockFirebase: FirebaseApp }

export const initializeMockFirebase = () => {
  const mockauth = new firebasemock.MockAuthentication()
  mockauth.currentUser = { uid: 'mockedUserId' }
  mockauth.autoFlush()
  const mockfirestore = new firebasemock.MockFirestore()
  mockfirestore.autoFlush()
  const mockStorage = new firebasemock.MockStorage()
  mockStorage.autoFlush()
  const mockSdk = new firebasemock.MockFirebaseSdk(
    null, // realtime database
    () => mockauth,
    () => mockfirestore,
    () => mockStorage,
    null // messaging
  )
  const firebase = mockSdk.initializeApp()
  ;(global as any as ExtendedGlobal).mockFirebase = firebase
  return firebase
}

export const getMockedFirebase = () => {
  const g = global as any as ExtendedGlobal
  if (!g.mockFirebase) {
    throw new Error('Mock firebase is not present. Be sure to mock it first using "initializeMockFirebase"')
  } else {
    return g.mockFirebase
  }
}
